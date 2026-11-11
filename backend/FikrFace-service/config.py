import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ✅ Lowered threshold for real-world matching
    FACE_MATCH_THRESHOLD = float(os.getenv('FACE_MATCH_THRESHOLD', '0.50'))

    # Liveness thresholds
    BLINK_THRESHOLD = float(os.getenv('BLINK_THRESHOLD', '0.25'))
    BLINK_CONSECUTIVE_FRAMES = int(os.getenv('BLINK_CONSECUTIVE_FRAMES', '2'))
    MIN_BLINKS_FOR_ALIVE = int(os.getenv('MIN_BLINKS_FOR_ALIVE', '1'))

    HEAD_MOVEMENT_THRESHOLD = float(os.getenv('HEAD_MOVEMENT_THRESHOLD', '0.02'))
    MIN_HEAD_MOVEMENT = float(os.getenv('MIN_HEAD_MOVEMENT', '0.03'))

    DEPTH_VARIATION_THRESHOLD = float(os.getenv('DEPTH_VARIATION_THRESHOLD', '0.02'))
    MIN_DEPTH_VARIATION = float(os.getenv('MIN_DEPTH_VARIATION', '0.01'))

    TEXTURE_LAPLACIAN_THRESHOLD = float(os.getenv('TEXTURE_LAPLACIAN_THRESHOLD', '80'))

    MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', '800'))
    FACE_DETECTION_CONFIDENCE = float(os.getenv('FACE_DETECTION_CONFIDENCE', '0.5'))

    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', '5001'))
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'