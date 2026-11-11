import os
import sys
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from services.embedding_service import EmbeddingService
from services.liveness_service import LivenessService
from utils.image_utils import base64_to_image, preprocess_image

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize services
embedding_service = EmbeddingService(model_name='Facenet512')
liveness_service = LivenessService()

# In-memory storage for embeddings (replace with database in production)
# Structure: { userId: { embeddings: [[...], [...]], images: [base64, ...] } }
face_data = {}


# ───────────────────────────────────────────────────
# HEALTH CHECK
# ───────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'services': {
            'embedding': 'Facenet',
            'liveness': 'active'
        },
        'stored_users': len(face_data)
    })


# ───────────────────────────────────────────────────
# ENROLL FACE
# ───────────────────────────────────────────────────
@app.route('/enroll', methods=['POST'])
def enroll():
    try:
        data = request.get_json()
        user_id = data['userId']
        image_strings = data['images']
        
        images = [base64_to_image(img) for img in image_strings]
        images = [preprocess_image(img) for img in images]
        
        embeddings = embedding_service.generate_embeddings_from_multiple(images)
        
        # Return embeddings to Express (which will store in MongoDB)
        return jsonify({
            'success': True,
            'userId': user_id,
            'embeddings': [emb.tolist() for emb in embeddings],  # ✅ return embeddings
            'embeddingCount': len(embeddings),
            'message': f'Face enrolled with {len(embeddings)} embeddings'
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ───────────────────────────────────────────────────
# VERIFY FACE
# ───────────────────────────────────────────────────
@app.route('/verify', methods=['POST'])
def verify():
    """
    Verify a user's face against stored embeddings.
    
    Request body:
    {
        "userId": "507f1f77bcf86cd799439011",
        "image": "base64_image"
    }
    
    Response:
    {
        "success": true,
        "match": true,
        "confidence": 0.9234,
        "threshold": 0.68
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'userId' not in data or 'image' not in data:
            return jsonify({'success': False, 'error': 'userId and image are required'}), 400
        
        user_id = data['userId']
        image_str = data['image']
        
        # Check if user is enrolled
        if user_id not in face_data:
            return jsonify({'success': False, 'error': 'User not enrolled'}), 404
        
        # Convert and preprocess image
        image = base64_to_image(image_str)
        image = preprocess_image(image)
        
        # Generate embedding for query image
        query_embedding = embedding_service.generate_embedding(image)
        
        # Get stored embeddings
        stored_embeddings = [np.array(emb) for emb in face_data[user_id]['embeddings']]
        
        # Compare
        result = embedding_service.find_best_match(query_embedding, stored_embeddings)
        
        return jsonify({
            'success': True,
            'match': result['match'],
            'confidence': result['confidence'],
            'threshold': Config.FACE_MATCH_THRESHOLD
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ───────────────────────────────────────────────────
# LIVENESS CHECK
# ───────────────────────────────────────────────────
@app.route('/liveness', methods=['POST'])
def liveness():
    """
    Check liveness of a user from multiple frames.
    """
    try:
        data = request.get_json()
        
        if not data or 'images' not in data:
            return jsonify({'success': False, 'error': 'images array is required'}), 400
        
        image_strings = data['images']
        landmarks_list = data.get('landmarks', None)
        
        # Convert images
        images = []
        for img_str in image_strings:
            try:
                image = base64_to_image(img_str)
                images.append(image)
            except Exception as e:
                return jsonify({'success': False, 'error': f'Invalid image: {str(e)}'}), 400
        
        # Run liveness check
        result = liveness_service.check_liveness(images, landmarks_list)
        
        # ✅ CONVERT ALL NUMPY TYPES TO PYTHON NATIVE TYPES
        def convert_to_native(obj):
            """Recursively convert NumPy types to Python native types."""
            if isinstance(obj, dict):
                return {key: convert_to_native(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_native(item) for item in obj]
            elif isinstance(obj, np.bool_):
                return bool(obj)
            elif isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            else:
                return obj
        
        native_result = convert_to_native(result)
        
        return jsonify({
            'success': True,
            'alive': native_result.get('alive', False),
            'score': native_result.get('score', 0.0),
            'checks': native_result.get('checks', {}),
            'details': native_result.get('details', {})
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
# ───────────────────────────────────────────────────
# REMOVE FACE PROFILE
# ───────────────────────────────────────────────────
@app.route('/remove/<userId>', methods=['DELETE'])
def remove_face(userId):
    """
    Remove a user's face profile.
    
    Response:
    {
        "success": true,
        "message": "Face profile removed"
    }
    """
    try:
        if userId in face_data:
            del face_data[userId]
            return jsonify({'success': True, 'message': 'Face profile removed'})
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/compare', methods=['POST'])
def compare():
    try:
        data = request.get_json()
        image_str = data['image']
        stored_embeddings = data['storedEmbeddings']  # from MongoDB
        
        image = base64_to_image(image_str)
        image = preprocess_image(image)
        
        query_embedding = embedding_service.generate_embedding(image)
        stored_embeddings_np = [np.array(emb) for emb in stored_embeddings]
        
        result = embedding_service.find_best_match(query_embedding, stored_embeddings_np)
        
        return jsonify({
            'success': True,
            'match': result['match'],
            'confidence': result['confidence']
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/identify', methods=['POST'])
def identify():
    """
    Identify a user by searching all stored embeddings.
    No username required — pure face matching.
    """
    try:
        data = request.get_json()
        image_str = data['image']
        stored_embeddings_list = data['storedEmbeddingsList']  # Array of { userId, embeddings }

        if not stored_embeddings_list or len(stored_embeddings_list) == 0:
            return jsonify({'success': False, 'error': 'No enrolled users in database'}), 404

        # Convert image to embedding
        image = base64_to_image(image_str)
        image = preprocess_image(image)
        query_embedding = embedding_service.generate_embedding(image)

        best_match = None
        best_confidence = 0

        # Compare against ALL enrolled users
        for user_data in stored_embeddings_list:
            stored_embeddings_np = [np.array(emb) for emb in user_data['embeddings']]
            result = embedding_service.find_best_match(query_embedding, stored_embeddings_np)

            if result['match'] and result['confidence'] > best_confidence:
                best_confidence = result['confidence']
                best_match = {
                    'userId': user_data['userId'],
                    'confidence': round(result['confidence'], 4)
                }

        if best_match and best_match['confidence'] >= Config.FACE_MATCH_THRESHOLD:
            return jsonify({
                'success': True,
                'identified': True,
                'userId': best_match['userId'],
                'confidence': best_match['confidence']
            })
        else:
            return jsonify({
                'success': True,
                'identified': False,
                'message': 'Face not recognized',
                'bestConfidence': round(best_confidence, 4)
            })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500        



# ───────────────────────────────────────────────────
# START SERVER
# ───────────────────────────────────────────────────
if __name__ == '__main__':
    print('🚀 Starting Fikr Smart Face Recognition Service...')
    print(f'   Host: {Config.HOST}')
    print(f'   Port: {Config.PORT}')
    print(f'   Model: Facenet512 (4 checks)')
    print('')
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )