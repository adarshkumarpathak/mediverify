import os
import json
import time
import logging
import numpy as np
import cv2
import torch
import torch.nn as nn
import torchvision.models as torchmodels
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input

logger = logging.getLogger(__name__)

# ── CONFIG ─────────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TF_MODEL_PATH  = os.path.join(BASE_DIR, "model", "best_model.h5")
FFT_MODEL_PATH = os.path.join(BASE_DIR, "model", "best_model_fft.pth")
TF_CONFIG_PATH = os.path.join(BASE_DIR, "model", "model_config.json")
IMG_SIZE       = (224, 224)
DEVICE         = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── MODEL ARCHITECTURE ─────────────────────────────────────────────────────────
# CRITICAL: This must match EXACTLY how the model was trained in train_fft_torch.py
# Class name, layer sizes, channel counts — all must be identical to the saved .pth

class MediVerifyFFT(nn.Module):
    def __init__(self):
        super().__init__()

        # Visual branch — EfficientNetB0 feature extractor
        efficientnet = torchmodels.efficientnet_b0(weights=None)
        self.visual_branch = nn.Sequential(
            *list(efficientnet.children())[:-1]
        )
        self.visual_fc = nn.Sequential(
            nn.Flatten(),
            nn.BatchNorm1d(1280),
            nn.Dropout(0.4),
            nn.Linear(1280, 128),
            nn.ReLU()
        )

        # FFT branch — processes 1-channel 64x64 frequency spectrum
        self.fft_branch = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(4),
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 64), nn.ReLU(),
            nn.Dropout(0.3)
        )

        # Classifier — 128 visual + 64 FFT = 192 merged features
        self.classifier = nn.Sequential(
            nn.Linear(128 + 64, 128), nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64), nn.ReLU(),
            nn.Linear(64, 1), nn.Sigmoid()
        )

    def forward(self, img, fft):
        x1 = self.visual_branch(img)
        x1 = self.visual_fc(x1)
        x2 = self.fft_branch(fft)
        x  = torch.cat([x1, x2], dim=1)
        return self.classifier(x).squeeze(1)


# ── MODEL LOADING ──────────────────────────────────────────────────────────────
_tf_model      = None
_fft_model     = None
_tf_threshold  = 0.3


def _load_models():
    global _tf_model, _fft_model, _tf_threshold

    # Load TF threshold from config
    try:
        with open(TF_CONFIG_PATH) as f:
            _tf_threshold = json.load(f).get("confidence_threshold", 0.3)
        logger.info(f"TF threshold loaded: {_tf_threshold}")
    except Exception as e:
        logger.warning(f"Could not load TF config: {e} — using default 0.3")

    # Load TensorFlow EfficientNetB0
    try:
        _tf_model = tf.keras.models.load_model(TF_MODEL_PATH)
        logger.info("✅ TF EfficientNetB0 model loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load TF model: {e}")

    # Load PyTorch FFT model
    try:
        _fft_model = MediVerifyFFT().to(DEVICE)
        _fft_model.load_state_dict(
            torch.load(FFT_MODEL_PATH, map_location=DEVICE)
        )
        _fft_model.eval()
        logger.info(f"✅ PyTorch FFT model loaded (device: {DEVICE})")
    except Exception as e:
        logger.error(f"❌ Failed to load FFT model: {e}")


def get_models():
    global _tf_model, _fft_model
    if _tf_model is None or _fft_model is None:
        _load_models()
    return _tf_model, _fft_model


# ── PREPROCESSING ──────────────────────────────────────────────────────────────

def _preprocess_tf(image_bytes: bytes) -> np.ndarray:
    """
    Decode image bytes → resize to 224x224 → EfficientNet preprocess_input.
    CRITICAL: Do NOT use rescale=1./255 — causes double normalization → 50% accuracy.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    img = cv2.resize(img, IMG_SIZE)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype("float32")
    img = preprocess_input(img)
    return np.expand_dims(img, axis=0)  # shape: (1, 224, 224, 3)


def _compute_fft(img_bgr: np.ndarray) -> np.ndarray:
    """
    Convert BGR image to FFT magnitude spectrum.
    Returns 64x64 single-channel float32 array normalized to [0, 1].
    Matches extract_fft() in test_combined.py exactly.
    """
    gray      = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    fft       = np.fft.fft2(gray)
    fft_shift = np.fft.fftshift(fft)
    magnitude = np.log(np.abs(fft_shift) + 1)
    magnitude = magnitude / magnitude.max()
    return cv2.resize(magnitude, (64, 64)).astype('float32')


def _preprocess_fft(image_bytes: bytes):
    """
    Decode image bytes and prepare both tensors for MediVerifyFFT model.

    Returns:
        img_tensor: (1, 3, 224, 224) — ImageNet normalized
        fft_tensor: (1, 1, 64, 64)   — FFT magnitude spectrum
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")

    img_resized = cv2.resize(img, IMG_SIZE)

    # FFT tensor — 1 channel, 64x64
    fft        = _compute_fft(img_resized)
    fft_tensor = torch.from_numpy(fft).unsqueeze(0).unsqueeze(0).to(DEVICE)

    # Image tensor — ImageNet normalization (matches training)
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    img_t   = torch.from_numpy(
        img_rgb.transpose(2, 0, 1)
    ).float() / 255.0
    mean    = torch.from_numpy(
        np.array([0.485, 0.456, 0.406], dtype=np.float32)
    ).view(3, 1, 1)
    std     = torch.from_numpy(
        np.array([0.229, 0.224, 0.225], dtype=np.float32)
    ).view(3, 1, 1)
    img_t   = ((img_t - mean) / std).unsqueeze(0).to(DEVICE)

    return img_t, fft_tensor


# ── VERDICT LOGIC ──────────────────────────────────────────────────────────────

def _get_verdict(tf_conf: float, fft_conf: float) -> str:
    """
    Combined verdict from both models.
    FFT model is weighted higher — it catches AI-generated images
    that the visual CNN misses entirely.

    Thresholds:
      fft > 0.9 alone   → manipulated (AI-generated catch)
      both > 0.5        → manipulated
      either > 0.5      → suspicious
      else              → authentic
    """
    if fft_conf > 0.9 and tf_conf > 0.5:
        return "manipulated"
    elif fft_conf > 0.9:
        return "manipulated"
    elif tf_conf > 0.5 and fft_conf > 0.5:
        return "manipulated"
    elif tf_conf > 0.5 or fft_conf > 0.5:
        return "suspicious"
    else:
        return "authentic"


# ── MAIN PREDICT FUNCTION ──────────────────────────────────────────────────────

def predict(image_bytes: bytes) -> dict:
    """
    Run both models on the image and return combined verdict.

    Returns:
        {
            "result":             "authentic" | "suspicious" | "manipulated",
            "tf_confidence":      float (0-100),
            "fft_confidence":     float (0-100),
            "combined_score":     float (0-100),
            "processing_time_ms": int
        }
    """
    start = time.time()

    tf_model, fft_model = get_models()

    tf_conf  = 0.0
    fft_conf = 0.0

    # ── TF Model inference
    if tf_model is not None:
        try:
            img_array = _preprocess_tf(image_bytes)
            raw       = tf_model.predict(img_array, verbose=0)
            tf_conf   = float(raw[0][0])
        except Exception as e:
            logger.error(f"TF inference error: {e}")

    # ── FFT Model inference
    if fft_model is not None:
        try:
            img_t, fft_t = _preprocess_fft(image_bytes)
            with torch.no_grad():
                raw      = fft_model(img_t, fft_t)
                fft_conf = float(raw.squeeze().cpu().item())
        except Exception as e:
            logger.error(f"FFT inference error: {e}")

    # ── Verdict
    verdict = _get_verdict(tf_conf, fft_conf)

    # Combined score — FFT weighted higher (55%) for AI detection
    combined_score = (tf_conf * 0.45) + (fft_conf * 0.55)

    elapsed_ms = int((time.time() - start) * 1000)

    return {
        "result":             verdict,
        "tf_confidence":      round(tf_conf * 100, 2),
        "fft_confidence":     round(fft_conf * 100, 2),
        "combined_score":     round(combined_score * 100, 2),
        "processing_time_ms": elapsed_ms,
    }