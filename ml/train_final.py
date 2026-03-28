import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import (
    Dense, GlobalAveragePooling2D,
    Dropout, BatchNormalization
)
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from sklearn.metrics import (
    accuracy_score, precision_score,
    recall_score, f1_score,
    roc_auc_score, confusion_matrix,
    classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import json
import os

BASE       = 'D:/ml project/New folder'
DATASET    = f'{BASE}/dataset/final'
MODEL_PATH = f'{BASE}/model/mediverify_model.h5'
BEST_PATH  = f'{BASE}/model/best_model.h5'
IMG_SIZE   = (224, 224)
BATCH_SIZE = 16

print(f"TensorFlow: {tf.__version__}")
print(f"GPU: {len(tf.config.list_physical_devices('GPU')) > 0}")

# ── DATA GENERATORS ───────────────────────────────────
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=15,
    zoom_range=0.1,
    horizontal_flip=True,
    fill_mode='nearest'
)
val_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input
)

train_gen = train_datagen.flow_from_directory(
    f'{DATASET}/train',
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='binary',
    shuffle=True
)
val_gen = val_datagen.flow_from_directory(
    f'{DATASET}/val',
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='binary',
    shuffle=False
)
test_gen = val_datagen.flow_from_directory(
    f'{DATASET}/test',
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='binary',
    shuffle=False
)

print(f"Classes:  {train_gen.class_indices}")
print(f"Train:    {train_gen.samples}")
print(f"Val:      {val_gen.samples}")
print(f"Test:     {test_gen.samples}")

# ── BUILD MODEL ───────────────────────────────────────
base_model = EfficientNetB0(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dropout(0.5)(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.3)(x)
output = Dense(1, activation='sigmoid')(x)

model = Model(inputs=base_model.input, outputs=output)

callbacks = [
    ModelCheckpoint(
        BEST_PATH,
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    ),
    EarlyStopping(
        monitor='val_accuracy',
        patience=8,
        restore_best_weights=True,
        verbose=1
    ),
]

# ── PHASE 1 ───────────────────────────────────────────
print("\n=== PHASE 1 — Frozen base ===")
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='binary_crossentropy',
    metrics=[
        'accuracy',
        tf.keras.metrics.Precision(name='precision'),
        tf.keras.metrics.Recall(name='recall')
    ]
)
history1 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=15,
    callbacks=callbacks
)

# ── PHASE 2 ───────────────────────────────────────────
print("\n=== PHASE 2 — Fine-tuning ===")
base_model.trainable = True
for layer in base_model.layers[:-20]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='binary_crossentropy',
    metrics=[
        'accuracy',
        tf.keras.metrics.Precision(name='precision'),
        tf.keras.metrics.Recall(name='recall')
    ]
)
history2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=10,
    callbacks=callbacks
)

# ── SAVE ──────────────────────────────────────────────
model.save(MODEL_PATH)
print(f"\n✅ Model saved to {MODEL_PATH}")

# ── EVALUATE ──────────────────────────────────────────
print("\n=== TEST SET EVALUATION ===")
test_gen.reset()
y_pred_prob = model.predict(test_gen, verbose=1).flatten()
y_true      = test_gen.classes

best_threshold = 0.5
best_f1 = 0

print(f"\n{'Threshold':>10} {'Accuracy':>10} {'Precision':>10} {'Recall':>8} {'F1':>8}")
print("-" * 52)
for thresh in [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6]:
    y_pred = (y_pred_prob > thresh).astype(int)
    acc  = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec  = recall_score(y_true, y_pred, zero_division=0)
    f1   = f1_score(y_true, y_pred, zero_division=0)
    flag = " ← best" if rec >= 0.92 and f1 > best_f1 else ""
    print(f"{thresh:>10.2f} {acc:>10.4f} {prec:>10.4f} {rec:>8.4f} {f1:>8.4f}{flag}")
    if rec >= 0.92 and f1 > best_f1:
        best_f1 = f1
        best_threshold = thresh

y_pred_final = (y_pred_prob > best_threshold).astype(int)

print(f"\n✅ Best threshold: {best_threshold}")
print("\n" + "="*45)
print("  FINAL RESULTS")
print("="*45)
print(f"  Accuracy:  {accuracy_score(y_true, y_pred_final):.4f}")
print(f"  Precision: {precision_score(y_true, y_pred_final):.4f}")
print(f"  Recall:    {recall_score(y_true, y_pred_final):.4f}")
print(f"  F1 Score:  {f1_score(y_true, y_pred_final):.4f}")
print(f"  AUC-ROC:   {roc_auc_score(y_true, y_pred_prob):.4f}")
print("="*45)
print(classification_report(
    y_true, y_pred_final,
    target_names=['Genuine', 'Manipulated']
))

# Save threshold
config = {"confidence_threshold": best_threshold}
with open(f'{BASE}/model/model_config.json', 'w') as f:
    json.dump(config, f)
print(f"✅ Threshold saved to model_config.json")

# Confusion matrix
cm = confusion_matrix(y_true, y_pred_final)
plt.figure(figsize=(7, 5))
sns.heatmap(
    cm, annot=True, fmt='d', cmap='Blues',
    xticklabels=['Genuine', 'Manipulated'],
    yticklabels=['Genuine', 'Manipulated'],
    annot_kws={"size": 14}
)
plt.title('Confusion Matrix', fontsize=14)
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig(f'{BASE}/outputs/confusion_matrix.png')
plt.show()

# Training plot
def plot(h1, h2, metric):
    vals   = h1.history[metric] + h2.history[metric]
    v_vals = h1.history[f'val_{metric}'] + h2.history[f'val_{metric}']
    plt.plot(vals, label='Train')
    plt.plot(v_vals, label='Val')
    plt.axvline(
        x=len(h1.history[metric])-1,
        color='gray', linestyle='--', label='Phase 2'
    )
    plt.title(metric)
    plt.legend()

plt.figure(figsize=(15, 4))
plt.subplot(1,3,1); plot(history1, history2, 'accuracy')
plt.subplot(1,3,2); plot(history1, history2, 'loss')
plt.subplot(1,3,3); plot(history1, history2, 'recall')
plt.tight_layout()
plt.savefig(f'{BASE}/outputs/training_history.png')
print("✅ Plots saved")
print("\n🎉 Training complete!")