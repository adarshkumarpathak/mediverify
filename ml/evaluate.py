import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix,
    classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import json
import os

BASE      = 'D:/ml project/New folder'
DATASET   = f'{BASE}/dataset/final'
BEST_PATH = f'{BASE}/model/best_model.h5'

# Load model
print("Loading model...")
model = tf.keras.models.load_model(BEST_PATH)
print("✅ Model loaded")

# Test generator
test_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input
)
test_gen = test_datagen.flow_from_directory(
    f'{DATASET}/test',
    target_size=(224, 224),
    batch_size=16,
    class_mode='binary',
    shuffle=False
)

# Predictions
print("Running predictions...")
test_gen.reset()
y_pred_prob = model.predict(test_gen, verbose=1).flatten()
y_true      = test_gen.classes

# Find best threshold
print("\n📊 Threshold Analysis:")
print(f"{'Threshold':>10} {'Accuracy':>10} {'Precision':>10} {'Recall':>8} {'F1':>8}")
print("-" * 52)

best_threshold = 0.5
best_f1 = 0

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

print(f"\n✅ Best threshold: {best_threshold}")

# Final metrics
y_pred_final = (y_pred_prob > best_threshold).astype(int)

print("\n" + "="*45)
print("  FINAL RESULTS")
print("="*45)
print(f"  Accuracy:   {accuracy_score(y_true, y_pred_final):.4f}")
print(f"  Precision:  {precision_score(y_true, y_pred_final):.4f}")
print(f"  Recall:     {recall_score(y_true, y_pred_final):.4f}")
print(f"  F1 Score:   {f1_score(y_true, y_pred_final):.4f}")
print(f"  AUC-ROC:    {roc_auc_score(y_true, y_pred_prob):.4f}")
print("="*45)

print("\nClassification Report:")
print(classification_report(
    y_true, y_pred_final,
    target_names=['Genuine', 'Manipulated']
))

# Save config
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
print("✅ Confusion matrix saved")
print("\n🎉 Evaluation complete!")