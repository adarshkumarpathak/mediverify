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
BASE_DIR        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TF_MODEL_PATH   = os.path.join(BASE_DIR, "model", "best_model.h5")
FFT_MODEL_PATH  = os.path.join(BASE_DIR, "model", "best_model_fft.pth")
TF_CONFIG_PATH  = os.path.join(BASE_DIR, "model", "model_config.json")
IMG_SIZE        = (224, 224)
DEVICE          = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── FFT MODEL ARCHITECTURE ─────────────────────────────────────────────────────
# Must match exactly how the model was trained in train_fft_torch.py
class FFTBranch(nn.Module):
    """CNN that processes FFT frequency spectrum images."""
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(), nn.AdaptiveAvgPool2d(4),
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
        )

    def forward(self, x):
        return self.net(x)


class DualInputFFTModel(nn.Module):
    """
    Dual-input model:
      Branch 1: EfficientNetB0 → 128 features (visual tampering)
      Branch 2: FFT CNN → 64 features (frequency fingerprints)
      Merged:   192 → classifier
    """
    def __init__(self):
        super().__init__()

        # Branch 1 — EfficientNetB0 image features
        efficientnet = torchmodels.efficientnet_b0(pretrained=False)
        efficientnet.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(efficientnet.classifier[1].in_features, 128),
            nn.ReLU(),
        )
        self.image_branch = efficientnet

        # Branch 2 — FFT frequency features
        self.fft_branch = FFTBranch()

        # Classifier head
        self.classifier = nn.Sequential(
            nn.Linear(192, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )

    def forward(self, img, fft):
        img_features = self.image_branch(img)
        fft_features = self.fft_branch(fft)
        merged       = torch.cat([img_features, fft_features], dim=1)
        return self.classifier(merged)


# ── MODEL LOADING ──────────────────────────────────────────────────────────────
_tf_model   = None
_fft_model  = None
_tf_threshold  = 0.3
_fft_threshold = 0.3


def _load_models():
    global _tf_model, _fft_model, _tf_threshold, _fft_threshold

    # Load TF threshold
    try:
        with open(TF_CONFIG_PATH) as f:
            _tf_threshold = json.load(f).get("confidence_threshold", 0.3)
        logger.info(f"TF threshold: {_tf_threshold}")
    except Exception as e:
        logger.warning(f"Could not load TF config: {e}, using 0.3")

    # Load TF model
    try:
        _tf_model = tf.keras.models.load_model(TF_MODEL_PATH)
        logger.info("✅ TF EfficientNetB0 model loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load TF model: {e}")

    # Load PyTorch FFT model
    try:
        _fft_model = DualInputFFTModel().to(DEVICE)
        checkpoint = torch.load(FFT_MODEL_PATH, map_location=DEVICE)
        # Handle both raw state_dict and wrapped checkpoint
        state_dict = checkpoint.get("model_state_dict", checkpoint)
        _fft_model.load_state_dict(state_dict)
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
    """Decode → resize → EfficientNet preprocess_input (NOT rescale)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    img = cv2.resize(img, IMG_SIZE)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype("float32")
    img = preprocess_input(img)          # ← CRITICAL: do NOT use /255 here
    return np.expand_dims(img, axis=0)   # shape: (1, 224, 224, 3)


def _compute_fft(img_rgb: np.ndarray) -> np.ndarray:
    """
    Convert image to FFT frequency spectrum.
    Returns normalized 3-channel float32 array (224, 224, 3).
    """
    gray     = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    f        = np.fft.fft2(gray)
    fshift   = np.fft.fftshift(f)
    mag      = np.log(np.abs(fshift) + 1e-10)
    mag_norm = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    mag_rgb  = cv2.cvtColor(mag_norm, cv2.COLOR_GRAY2RGB)
    mag_rgb  = cv2.resize(mag_rgb, IMG_SIZE)
    return mag_rgb.astype("float32") / 255.0


def _preprocess_fft(image_bytes: bytes):
    """Returns (img_tensor, fft_tensor) ready for PyTorch model."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    img   = cv2.resize(img, IMG_SIZE)
    img   = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Image tensor: normalize to [0,1], channels first
    img_norm   = img.astype("float32") / 255.0
    img_tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(DEVICE)

    # FFT tensor
    fft_arr    = _compute_fft(img)
    fft_tensor = torch.from_numpy(fft_arr).permute(2, 0, 1).unsqueeze(0).to(DEVICE)

    return img_tensor, fft_tensor


# ── VERDICT LOGIC ──────────────────────────────────────────────────────────────
def _get_verdict(tf_conf: float, fft_conf: float) -> str:
    """
    Only ML models score the verdict.
    ELA/noise/metadata are informational only (not used here).
    """
    if fft_conf > 0.9 and tf_conf > 0.5:
        return "manipulated"
    elif fft_conf > 0.9:
        return "manipulated"       # FFT alone is enough — catches AI-generated images
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
            "result":          "authentic" | "suspicious" | "manipulated",
            "tf_confidence":   float (0-100),
            "fft_confidence":  float (0-100),
            "combined_score":  float (0-100),
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

    # Combined score: weighted average (FFT weighted higher for AI detection)
    combined_score = (tf_conf * 0.45) + (fft_conf * 0.55)

    elapsed_ms = int((time.time() - start) * 1000)

    return {
        "result":             verdict,
        "tf_confidence":      round(tf_conf * 100, 2),
        "fft_confidence":     round(fft_conf * 100, 2),
        "combined_score":     round(combined_score * 100, 2),
        "processing_time_ms": elapsed_ms,
    }
