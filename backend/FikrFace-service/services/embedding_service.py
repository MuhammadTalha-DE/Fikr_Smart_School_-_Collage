import numpy as np
from deepface import DeepFace
from config import Config


class EmbeddingService:

    def __init__(self, model_name='Facenet512'):
        self.model_name = model_name
        print(f'✅ EmbeddingService initialized with model: {model_name}')

    def generate_embedding(self, image):
        """
        Generate a face embedding from a single image.
        Tries multiple detectors in order of reliability.
        """
        detectors = ['opencv', 'mtcnn', 'ssd', 'dlib']

        for detector in detectors:
            try:
                embedding_objs = DeepFace.represent(
                    img_path=image,
                    model_name=self.model_name,
                    enforce_detection=True,
                    detector_backend=detector,
                    align=True
                )
                if embedding_objs and len(embedding_objs) > 0:
                    embedding = np.array(embedding_objs[0]['embedding'])
                    print(f'   ✅ Face detected with {detector}')
                    return embedding
                else:
                    print(f'   ⚠️ {detector}: no face found')
            except Exception as e:
                print(f'   ⚠️ {detector}: {str(e)[:80]}')
                continue

        raise Exception('No face detected with any detector')

    def generate_embeddings_from_multiple(self, images):
        embeddings = []
        for i, image in enumerate(images):
            try:
                embedding = self.generate_embedding(image)
                embeddings.append(embedding)
                print(f'✅ Generated embedding {i+1}/{len(images)}')
            except Exception as e:
                print(f'⚠️ Failed to generate embedding for image {i+1}: {str(e)}')
        if len(embeddings) == 0:
            raise Exception('Failed to generate any embeddings')
        return embeddings

    def compare_embeddings(self, embedding1, embedding2):
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(dot_product / (norm1 * norm2))

    def find_best_match(self, query_embedding, stored_embeddings, threshold=None):
        if threshold is None:
            threshold = getattr(Config, 'FACE_MATCH_THRESHOLD', 0.50)
        if not stored_embeddings:
            return {'match': False, 'confidence': 0.0, 'best_similarity': 0.0}
        best_similarity = 0.0
        for i, stored_emb in enumerate(stored_embeddings):
            similarity = self.compare_embeddings(query_embedding, stored_emb)
            print(f'   📊 Embedding {i+1}: similarity={similarity:.4f}')
            best_similarity = max(best_similarity, similarity)
        match = best_similarity >= threshold
        print(f'   🎯 Best: {best_similarity:.4f} | Threshold: {threshold} | Match: {match}')
        return {
            'match': match,
            'confidence': round(best_similarity, 4),
            'best_similarity': round(best_similarity, 4)
        }