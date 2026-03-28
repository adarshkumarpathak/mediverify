import cv2
import numpy as np

def apply_clahe(image: np.ndarray) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE)
    to enhance the contrast of medical images (e.g., X-rays).
    """
    # Convert to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    
    # Create CLAHE object
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    
    # Apply to L channel
    lab[..., 0] = clahe.apply(lab[..., 0])
    
    # Convert back to BGR
    enhanced_img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    return enhanced_img

def preprocess_for_inference(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess raw image bytes for EfficientNetB0 inference.
    """
    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    # Resize to EfficientNetB0 input size
    img = cv2.resize(img, (224, 224))
    
    # Apply CLAHE
    img = apply_clahe(img)
    
    # Normalize pixel values
    img = img.astype("float32") / 255.0
    
    # Add batch dimension
    img = np.expand_dims(img, axis=0)
    
    return img
