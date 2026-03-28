import cv2
import numpy as np
import os
import random

GENUINE_PATH = 'D:/ml project/New folder/dataset/genuine'
AI_FAKE_DEST = 'D:/ml project/New folder/dataset/manipulated/ai_generated'
os.makedirs(AI_FAKE_DEST, exist_ok=True)

images = os.listdir(GENUINE_PATH)
print(f"Found {len(images)} genuine images to process")

def simulate_ai_generated(img):
    # Over-smoothing — GAN characteristic
    smooth = cv2.GaussianBlur(img, (5, 5), 1.5)
    result = cv2.addWeighted(img, 0.3, smooth, 0.7, 0)

    # Grid artifacts — diffusion model characteristic
    h, w = result.shape[:2]
    for i in range(0, h, 16):
        result[i, :] = np.clip(
            result[i, :].astype(int) + random.randint(-8, 8), 0, 255
        )
    for j in range(0, w, 16):
        result[:, j] = np.clip(
            result[:, j].astype(int) + random.randint(-8, 8), 0, 255
        )

    # Global contrast shift
    factor = random.uniform(0.85, 1.15)
    result = np.clip(
        result.astype(float) * factor, 0, 255
    ).astype('uint8')

    # High frequency noise
    noise = np.random.normal(0, 3, result.shape).astype('float32')
    result = np.clip(
        result.astype('float32') + noise, 0, 255
    ).astype('uint8')

    return result

def strong_copy_move(img):
    h, w = img.shape[:2]
    size = random.randint(60, 100)
    x1 = random.randint(0, w - size - 1)
    y1 = random.randint(0, h - size - 1)
    patch = img[y1:y1+size, x1:x1+size].copy()
    patch = cv2.flip(patch, 1)
    x2 = random.randint(0, w - size - 1)
    y2 = random.randint(0, h - size - 1)
    result = img.copy()
    result[y2:y2+size, x2:x2+size] = patch
    return result

def strong_noise(img):
    result = img.copy()
    h, w = img.shape[:2]
    x = random.randint(0, w - 120)
    y = random.randint(0, h - 120)
    noise = np.random.randint(60, 120, (120, 120, 3), dtype='uint8')
    result[y:y+120, x:x+120] = cv2.add(
        result[y:y+120, x:x+120], noise
    )
    return result

def strong_brightness(img):
    result = img.copy().astype(np.float32)
    h, w = img.shape[:2]
    x = random.randint(0, w - 120)
    y = random.randint(0, h - 120)
    factor = random.choice([0.1, 0.2, 2.5, 3.0])
    result[y:y+120, x:x+120] *= factor
    return np.clip(result, 0, 255).astype('uint8')

def text_overlay(img):
    result = img.copy()
    cv2.rectangle(result, (10, 10), (180, 50), (255, 255, 255), -1)
    cv2.putText(result, 'MODIFIED', (15, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 2)
    return result

def black_patch(img):
    result = img.copy()
    h, w = img.shape[:2]
    x = random.randint(0, w - 80)
    y = random.randint(0, h - 80)
    size = random.randint(50, 80)
    result[y:y+size, x:x+size] = 0
    return result

all_fns = [
    simulate_ai_generated,
    strong_copy_move,
    strong_noise,
    strong_brightness,
    text_overlay,
    black_patch
]

generated = 0
for i, filename in enumerate(images):
    img = cv2.imread(os.path.join(GENUINE_PATH, filename))
    if img is None:
        continue
    img = cv2.resize(img, (224, 224))
    fn = random.choice(all_fns)
    result = fn(img)
    save_name = f'manip_{i:04d}_{filename}'
    cv2.imwrite(
        os.path.join(AI_FAKE_DEST, save_name), result
    )
    generated += 1
    if generated % 200 == 0:
        print(f"  Generated {generated}/{len(images)}...")

print(f"✅ Total manipulated images generated: {generated}")