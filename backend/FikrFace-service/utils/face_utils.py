import cv2
import numpy as np


def align_face(image, left_eye, right_eye):
    """
    Align face based on eye positions.
    
    Args:
        image: numpy array
        left_eye: (x, y) tuple
        right_eye: (x, y) tuple
    
    Returns:
        numpy array: aligned face image
    """
    left_eye_center = np.array(left_eye)
    right_eye_center = np.array(right_eye)
    
    # Calculate angle
    dy = right_eye_center[1] - left_eye_center[1]
    dx = right_eye_center[0] - left_eye_center[0]
    angle = np.degrees(np.arctan2(dy, dx))
    
    # Desired eye positions
    desired_left_eye = (0.35, 0.35)
    desired_right_eye = (0.65, 0.35)
    desired_dist = desired_right_eye[0] - desired_left_eye[0]
    
    # Scale
    current_dist = np.linalg.norm(right_eye_center - left_eye_center)
    scale = desired_dist * image.shape[1] / current_dist
    
    # Rotation matrix
    center = tuple(np.array([image.shape[1], image.shape[0]]) / 2)
    M = cv2.getRotationMatrix2D(center, angle, scale)
    
    aligned = cv2.warpAffine(image, M, (image.shape[1], image.shape[0]))
    return aligned


def get_face_quality(image):
    """
    Assess face image quality.
    
    Args:
        image: numpy array (grayscale or BGR)
    
    Returns:
        dict: quality metrics { brightness, sharpness, contrast, overall }
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    # Brightness
    brightness = np.mean(gray)
    
    # Sharpness (Laplacian variance)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = laplacian.var()
    
    # Contrast (standard deviation)
    contrast = np.std(gray)
    
    # Overall quality score (0-100)
    brightness_score = min(brightness / 150, 1.0) * 100
    sharpness_score = min(sharpness / 500, 1.0) * 100
    contrast_score = min(contrast / 60, 1.0) * 100
    
    overall = (brightness_score + sharpness_score + contrast_score) / 3
    
    return {
        'brightness': round(brightness, 2),
        'sharpness': round(sharpness, 2),
        'contrast': round(contrast, 2),
        'overall': round(overall, 2)
    }