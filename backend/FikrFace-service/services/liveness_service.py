import cv2
import numpy as np
from config import Config


class LivenessService:
    """
    Anti‑spoofing liveness detection using multiple techniques:
    1. Blink detection (Eye Aspect Ratio)
    2. Head movement estimation (nose position variance)
    3. Depth variation check (face size changes)
    4. Texture analysis (Laplacian variance for screen/moire detection)
    """
    
    def __init__(self):
        print('✅ LivenessService initialized')
    
    # ──────────────────────────────────────────────────
    # LEVEL 1: BLINK DETECTION
    # ──────────────────────────────────────────────────
    
    def calculate_ear(self, eye_landmarks):
        """
        Calculate Eye Aspect Ratio (EAR).
        
        EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        
        Args:
            eye_landmarks: 6 points (x,y) of the eye region
        
        Returns:
            float: Eye Aspect Ratio
        """
        # Vertical distances
        A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        
        # Horizontal distance
        C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        
        if C == 0:
            return 0.0
        
        ear = (A + B) / (2.0 * C)
        return ear
    
    def detect_blinks(self, ear_values):
        """
        Count blinks from a sequence of EAR values.
        
        A blink is detected when EAR drops below threshold for consecutive frames,
        then rises back above.
        
        Args:
            ear_values: list of EAR values over time
        
        Returns:
            int: number of blinks detected
        """
        blinks = 0
        blink_in_progress = False
        consecutive_low = 0
        
        for ear in ear_values:
            if ear < Config.BLINK_THRESHOLD:
                consecutive_low += 1
                if consecutive_low >= Config.BLINK_CONSECUTIVE_FRAMES and not blink_in_progress:
                    blink_in_progress = True
            else:
                if blink_in_progress:
                    blinks += 1
                    blink_in_progress = False
                consecutive_low = 0
        
        return blinks
    
    # ──────────────────────────────────────────────────
    # LEVEL 2: HEAD MOVEMENT DETECTION
    # ──────────────────────────────────────────────────
    
    def detect_head_movement(self, nose_positions):
        """
        Detect head movement by tracking nose position variance.
        
        Args:
            nose_positions: list of (x,y) nose tip coordinates over time
        
        Returns:
            float: movement score (0-1, higher = more movement)
        """
        if len(nose_positions) < 2:
            return 0.0
        
        nose_positions = np.array(nose_positions)
        
        # Calculate variance in x and y directions
        x_variance = np.var(nose_positions[:, 0])
        y_variance = np.var(nose_positions[:, 1])
        
        # Normalize by frame dimensions
        movement_score = (x_variance + y_variance) / 2.0
        
        return movement_score
    
    # ──────────────────────────────────────────────────
    # LEVEL 3: DEPTH VARIATION
    # ──────────────────────────────────────────────────
    
    def check_depth_variation(self, face_sizes):
        """
        Check if face size changes over time (3D depth cue).
        
        A real 3D face will show slight size variations as the person moves.
        A flat photo/screen will have nearly constant size.
        
        Args:
            face_sizes: list of (width, height) of detected face bounding boxes
        
        Returns:
            float: depth variation score
        """
        if len(face_sizes) < 2:
            return 0.0
        
        sizes = np.array([w * h for w, h in face_sizes])
        variation = np.std(sizes) / np.mean(sizes) if np.mean(sizes) > 0 else 0.0
        
        return variation
    
    # ──────────────────────────────────────────────────
    # LEVEL 4: TEXTURE ANALYSIS
    # ──────────────────────────────────────────────────
    
    def analyze_texture(self, image):
        """
        Analyze image texture to detect screens/photos.
        
        Real faces have natural skin texture (high Laplacian variance).
        Screens and printed photos have reduced texture due to pixel patterns,
        moire effects, or paper smoothness.
        
        Args:
            image: numpy array (grayscale)
        
        Returns:
            float: Laplacian variance score
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()
        return variance
    
    # ──────────────────────────────────────────────────
    # FULL LIVENESS CHECK
    # ──────────────────────────────────────────────────
    
    def check_liveness(self, images, landmarks_list=None):
        """
        Comprehensive liveness check.
        
        Args:
            images: list of numpy arrays (consecutive frames)
            landmarks_list: optional list of MediaPipe face landmarks per frame
        
        Returns:
            dict: liveness assessment
        """
        result = {
            'alive': False,
            'score': 0.0,
            'checks': {},
            'details': {}
        }
        
        checks_passed = 0
        total_checks = 4
        
        # ── Check 1: Blink detection ──
        if landmarks_list:
            ear_values = []
            for landmarks in landmarks_list:
                if landmarks and len(landmarks) >= 468:  # MediaPipe has 468 landmarks
                    # Left eye landmarks (indices from MediaPipe)
                    left_eye = np.array([
                        landmarks[33], landmarks[160], landmarks[158],
                        landmarks[133], landmarks[153], landmarks[144]
                    ])
                    # Right eye landmarks
                    right_eye = np.array([
                        landmarks[362], landmarks[385], landmarks[387],
                        landmarks[263], landmarks[373], landmarks[380]
                    ])
                    
                    left_ear = self.calculate_ear(left_eye)
                    right_ear = self.calculate_ear(right_eye)
                    avg_ear = (left_ear + right_ear) / 2.0
                    ear_values.append(avg_ear)
            
            blink_count = self.detect_blinks(ear_values) if ear_values else 0
            blink_pass = blink_count >= Config.MIN_BLINKS_FOR_ALIVE
            result['checks']['blink'] = blink_pass
            result['details']['blink_count'] = blink_count
            if blink_pass:
                checks_passed += 1
        else:
            result['checks']['blink'] = False
            result['details']['blink_count'] = 0
        
        # ── Check 2: Head movement ──
        if landmarks_list:
            nose_positions = []
            for landmarks in landmarks_list:
                if landmarks and len(landmarks) > 1:
                    nose_tip = landmarks[1]  # MediaPipe nose tip
                    nose_positions.append((nose_tip.x, nose_tip.y))
            
            movement = self.detect_head_movement(nose_positions)
            movement_pass = movement >= Config.MIN_HEAD_MOVEMENT
            result['checks']['head_movement'] = movement_pass
            result['details']['movement_score'] = round(movement, 4)
            if movement_pass:
                checks_passed += 1
        else:
            result['checks']['head_movement'] = False
            result['details']['movement_score'] = 0.0
        
        # ── Check 3: Depth variation ──
        if landmarks_list:
            face_sizes = []
            for landmarks in landmarks_list:
                if landmarks and len(landmarks) > 10:
                    x_coords = [lm.x for lm in landmarks]
                    y_coords = [lm.y for lm in landmarks]
                    width = max(x_coords) - min(x_coords)
                    height = max(y_coords) - min(y_coords)
                    face_sizes.append((width, height))
            
            depth_var = self.check_depth_variation(face_sizes)
            depth_pass = depth_var >= Config.MIN_DEPTH_VARIATION
            result['checks']['depth'] = depth_pass
            result['details']['depth_variation'] = round(depth_var, 4)
            if depth_pass:
                checks_passed += 1
        else:
            result['checks']['depth'] = False
            result['details']['depth_variation'] = 0.0
        
        # ── Check 4: Texture analysis ──
        if images:
            texture_scores = [self.analyze_texture(img) for img in images]
            avg_texture = np.mean(texture_scores) if texture_scores else 0.0
            texture_pass = avg_texture >= Config.TEXTURE_LAPLACIAN_THRESHOLD
            result['checks']['texture'] = texture_pass
            result['details']['texture_score'] = round(avg_texture, 2)
            if texture_pass:
                checks_passed += 1
        else:
            result['checks']['texture'] = False
            result['details']['texture_score'] = 0.0
        
        # ── Overall assessment ──
        result['score'] = checks_passed / total_checks
        result['alive'] = checks_passed >= 3  # At least 3 of 4 checks must pass
        
        return result