import torch
import torch.nn as nn
import torchvision.models as models
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input
import cv2
import numpy as np
import os
from PIL import Image
import piexif

BASE      = 'D:/ml project/New folder'
TF_MODEL  = f'{BASE}/model/best_model.h5'
PTH_MODEL = f'{BASE}/model/best_model_fft.pth'
DEVICE    = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
THRESHOLD = 0.3

# ── LOAD TF MODEL ─────────────────────────────────────
print("Loading TensorFlow model...")
tf_model = tf.keras.models.load_model(TF_MODEL)
print("✅ TF model loaded")

# ── PYTORCH MODEL ─────────────────────────────────────
class MediVerifyFFT(nn.Module):
    def __init__(self):
        super().__init__()
        efficientnet = models.efficientnet_b0(weights=None)
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
        self.fft_branch = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(4),
            nn.Flatten(),
            nn.Linear(128*4*4, 64), nn.ReLU(),
            nn.Dropout(0.3)
        )
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

print("Loading PyTorch FFT model...")
pth_model = MediVerifyFFT().to(DEVICE)
pth_model.load_state_dict(
    torch.load(PTH_MODEL, map_location=DEVICE)
)
pth_model.eval()
print(f"✅ PyTorch model loaded on {DEVICE}")

# ── ANALYSIS FUNCTIONS ────────────────────────────────

def check_metadata(img_path):
    try:
        img  = Image.open(img_path)
        exif = img.info.get('exif', None)

        if exif is None:
            return {
                "status":  "neutral",
                "message": "No EXIF data — normal for medical images",
                "score":   0.3
            }

        exif_data = piexif.load(exif)
        software  = exif_data.get('0th', {}).get(
            piexif.ImageIFD.Software, None
        )

        if software:
            sw = software.decode('utf-8', errors='ignore').lower()
            ai_tools = [
                'dall-e', 'midjourney', 'stable diffusion',
                'adobe firefly', 'generative', 'openai'
            ]
            if any(t in sw for t in ai_tools):
                return {
                    "status":  "suspicious",
                    "message": f"AI software detected: {sw}",
                    "score":   1.0
                }

        return {
            "status":  "clean",
            "message": "Metadata looks normal",
            "score":   0.1
        }

    except Exception as e:
        return {
            "status":  "neutral",
            "message": "Could not read metadata",
            "score":   0.2
        }


def ela_analysis(img_path, quality=90):
    try:
        img  = Image.open(img_path).convert('RGB')
        temp = '_temp_ela.jpg'
        img.save(temp, 'JPEG', quality=quality)

        orig = np.array(img).astype(float)
        comp = np.array(Image.open(temp)).astype(float)

        ela       = np.abs(orig - comp)
        ela_score = ela.mean()

        if os.path.exists(temp):
            os.remove(temp)

        if ela_score > 20:
            status = "suspicious"
            msg    = f"High ELA score ({ela_score:.1f}) — strong tampering signal"
            score  = min(ela_score / 30, 1.0)
        elif ela_score > 10:
            status = "warning"
            msg    = f"Medium ELA score ({ela_score:.1f}) — possible tampering"
            score  = 0.4
        else:
            status = "clean"
            msg    = f"Low ELA score ({ela_score:.1f}) — looks authentic"
            score  = 0.1

        return {"status": status, "message": msg, "score": score}

    except Exception as e:
        return {
            "status":  "unknown",
            "message": f"ELA failed: {str(e)}",
            "score":   0.2
        }


def noise_analysis(img):
    gray      = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(float)
    blur      = cv2.GaussianBlur(gray, (5, 5), 0)
    noise     = gray - blur
    noise_std = noise.std()

    if noise_std < 1.5:
        return {
            "status":  "suspicious",
            "message": f"Extremely uniform noise ({noise_std:.2f}) — likely AI generated",
            "score":   0.8
        }
    elif noise_std < 2.0:
        return {
            "status":  "warning",
            "message": f"Very smooth noise ({noise_std:.2f}) — possibly AI generated",
            "score":   0.4
        }
    else:
        return {
            "status":  "clean",
            "message": f"Normal noise pattern ({noise_std:.2f})",
            "score":   0.1
        }


def extract_fft(img_bgr):
    gray      = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    fft       = np.fft.fft2(gray)
    fft_shift = np.fft.fftshift(fft)
    magnitude = np.log(np.abs(fft_shift) + 1)
    magnitude = magnitude / magnitude.max()
    return cv2.resize(magnitude, (64, 64)).astype('float32')


def tf_predict(img):
    img_resized = cv2.resize(img, (224, 224))
    img_array   = preprocess_input(img_resized.astype('float32'))
    img_array   = np.expand_dims(img_array, axis=0)
    return float(tf_model.predict(img_array, verbose=0)[0][0])


def pytorch_predict(img):
    img_resized = cv2.resize(img, (224, 224))

    fft        = extract_fft(img_resized)
    fft_tensor = torch.tensor(fft).unsqueeze(0).unsqueeze(0).to(DEVICE)

    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    img_t   = torch.tensor(
        img_rgb.transpose(2, 0, 1)
    ).float() / 255.0
    mean    = torch.tensor([0.485, 0.456, 0.406]).view(3,1,1)
    std     = torch.tensor([0.229, 0.224, 0.225]).view(3,1,1)
    img_t   = ((img_t - mean) / std).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        return pth_model(img_t, fft_tensor).item()


# ── FULL ANALYSIS ─────────────────────────────────────

def full_analysis(img_path):
    print(f"\n{'='*55}")
    print(f"  MEDIVERIFY ANALYSIS")
    print(f"  File: {os.path.basename(img_path)}")
    print(f"{'='*55}")

    img = cv2.imread(img_path)
    if img is None:
        print("❌ Could not read image")
        return

    # ── INFORMATIONAL CHECKS (display only) ───────────
    meta  = check_metadata(img_path)
    ela   = ela_analysis(img_path)
    noise = noise_analysis(img)

    icon = "🔴" if meta['status']  == 'suspicious' else \
           "🟡" if meta['status']  == 'warning'    else "🟢"
    print(f"\n[1] Metadata Analysis:   {icon}  (informational)")
    print(f"    {meta['message']}")

    icon = "🔴" if ela['status']   == 'suspicious' else \
           "🟡" if ela['status']   == 'warning'    else "🟢"
    print(f"\n[2] ELA Analysis:        {icon}  (informational)")
    print(f"    {ela['message']}")

    icon = "🔴" if noise['status'] == 'suspicious' else \
           "🟡" if noise['status'] == 'warning'    else "🟢"
    print(f"\n[3] Noise Analysis:      {icon}  (informational)")
    print(f"    {noise['message']}")

    # ── SCORING MODELS (verdict) ───────────────────────
    tf_conf  = tf_predict(img)
    tf_label = "MANIPULATED" if tf_conf > THRESHOLD else "GENUINE"
    icon     = "🔴" if tf_label == "MANIPULATED" else "🟢"
    print(f"\n[4] CNN Model (TF):      {icon}  (scored)")
    print(f"    {tf_label} — {tf_conf*100:.1f}% confidence")

    pt_conf  = pytorch_predict(img)
    pt_label = "MANIPULATED" if pt_conf > THRESHOLD else "GENUINE"
    icon     = "🔴" if pt_label == "MANIPULATED" else "🟢"
    print(f"\n[5] FFT Model (PyTorch): {icon}  (scored)")
    print(f"    {pt_label} — {pt_conf*100:.1f}% confidence")

    # ── FINAL VERDICT — ML MODELS ONLY ────────────────
    if pt_conf > 0.9 and tf_conf > 0.5:
        final_label = "MANIPULATED"
        confidence  = max(pt_conf, tf_conf) * 100
        reason      = "Both ML models agree — high confidence"
    elif pt_conf > 0.9:
        final_label = "MANIPULATED"
        confidence  = pt_conf * 100
        reason      = "FFT detected AI frequency fingerprint"
    elif tf_conf > 0.5 and pt_conf > 0.5:
        final_label = "MANIPULATED"
        confidence  = ((tf_conf + pt_conf) / 2) * 100
        reason      = "Both models flagged as manipulated"
    elif tf_conf > 0.5 or pt_conf > 0.5:
        final_label = "SUSPICIOUS"
        confidence  = max(tf_conf, pt_conf) * 100
        reason      = "One model flagged — manual review recommended"
    else:
        final_label = "AUTHENTIC"
        confidence  = (1 - max(tf_conf, pt_conf)) * 100
        reason      = "Both models confirm authentic"

    print(f"\n{'─'*55}")
    print(f"  FINAL VERDICT")
    print(f"{'─'*55}")
    print(f"  TF Score:   {tf_conf*100:.1f}%")
    print(f"  FFT Score:  {pt_conf*100:.1f}%")
    print(f"  Confidence: {confidence:.1f}%")

    if final_label == "MANIPULATED":
        print(f"\n  🔴 VERDICT: MANIPULATED / AI GENERATED")
        print(f"  ⚠️  {reason}")
    elif final_label == "SUSPICIOUS":
        print(f"\n  🟡 VERDICT: SUSPICIOUS")
        print(f"  ⚠️  {reason}")
    else:
        print(f"\n  🟢 VERDICT: LIKELY AUTHENTIC")
        print(f"  ✅ {reason}")

    print(f"{'='*55}\n")


# ── RUN TESTS ─────────────────────────────────────────

import random

DATASET = f'{BASE}/dataset/final'

def run_batch_test(directory, label, n=5):
    files = [
        f for f in os.listdir(directory)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]
    samples = random.sample(files, min(n, len(files)))
    print(f"\n{'#'*55}")
    print(f"  BATCH TEST — {label} ({len(samples)} images)")
    print(f"{'#'*55}")
    for f in samples:
        full_analysis(os.path.join(directory, f))

run_batch_test(f'{DATASET}/test/genuine',      'TEST GENUINE')
run_batch_test(f'{DATASET}/test/manipulated',  'TEST MANIPULATED')

# ── INTERACTIVE LOOP ──────────────────────────────────
print("\n" + "="*55)
print("  INTERACTIVE MODE — Type 'quit' to exit")
print("="*55)

while True:
    print("\nPaste image path (or 'quit' to exit):")
    path = input(">>> ").strip().strip('"').strip("'")
    if path.lower() == 'quit':
        print("Exiting!")
        break
    if not path:
        continue
    if not os.path.exists(path):
        print(f"❌ File not found: {path}")
        continue
    full_analysis(path)