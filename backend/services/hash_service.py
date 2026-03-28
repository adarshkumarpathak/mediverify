import hashlib

def calculate_image_hash(image_bytes: bytes) -> str:
    """
    Calculates a SHA256 hash of the image bytes to uniquely identify the image.
    This can be used for caching ML predictions or preventing duplicate uploads.
    """
    return hashlib.sha256(image_bytes).hexdigest()
