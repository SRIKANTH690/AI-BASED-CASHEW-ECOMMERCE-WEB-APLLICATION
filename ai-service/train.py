"""
Cashew Image Classification — Training Script
Uses scikit-learn (works on Python 3.14+)
Run: python train.py

Dataset expected at: ../frontend/
Subfolders: W180, W210, W240, W450, WBB, WBROKEN
"""

import os, json, pickle
import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# ── Config ─────────────────────────────────────────────────
DATASET_DIR   = os.path.join(os.path.dirname(__file__), '..', 'frontend')
MODEL_DIR     = os.path.join(os.path.dirname(__file__), 'model')
IMG_SIZE      = (64, 64)   # resize all images to 64x64
GRADE_FOLDERS = ['W180', 'W210', 'W240', 'W450', 'WBB', 'WBROKEN']

os.makedirs(MODEL_DIR, exist_ok=True)

# ── Load and preprocess images ─────────────────────────────
def load_images():
    X, y = [], []
    for grade in GRADE_FOLDERS:
        folder = os.path.join(DATASET_DIR, grade)
        if not os.path.exists(folder):
            print(f"⚠️  Folder not found: {folder}")
            continue
        files = [f for f in os.listdir(folder)
                 if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))]
        print(f"Loading {grade}: {len(files)} images")
        for fname in files:
            try:
                img_path = os.path.join(folder, fname)
                img = Image.open(img_path).convert('RGB')
                img = img.resize(IMG_SIZE)
                arr = np.array(img, dtype=np.float32) / 255.0
                # Extract color histogram features (fast, no deep learning needed)
                hist_r = np.histogram(arr[:,:,0], bins=16, range=(0,1))[0]
                hist_g = np.histogram(arr[:,:,1], bins=16, range=(0,1))[0]
                hist_b = np.histogram(arr[:,:,2], bins=16, range=(0,1))[0]
                # Mean and std per channel
                stats = [arr[:,:,0].mean(), arr[:,:,0].std(),
                         arr[:,:,1].mean(), arr[:,:,1].std(),
                         arr[:,:,2].mean(), arr[:,:,2].std()]
                features = np.concatenate([hist_r, hist_g, hist_b, stats])
                X.append(features)
                y.append(grade)
            except Exception as e:
                print(f"  Skipped {fname}: {e}")
    return np.array(X), np.array(y)

print("📂 Loading dataset...")
X, y = load_images()
print(f"\n✅ Total images loaded: {len(X)}")
print(f"Classes: {np.unique(y)}")

if len(X) == 0:
    print("❌ No images found. Check DATASET_DIR path.")
    exit(1)

# ── Encode labels ──────────────────────────────────────────
le = LabelEncoder()
y_enc = le.fit_transform(y)

# Save label encoder
with open(os.path.join(MODEL_DIR, 'label_encoder.pkl'), 'wb') as f:
    pickle.dump(le, f)
print(f"✅ Label encoder saved. Classes: {list(le.classes_)}")

# Save class mapping
class_map = {int(i): str(c) for i, c in enumerate(le.classes_)}
with open(os.path.join(MODEL_DIR, 'class_indices.json'), 'w') as f:
    json.dump(class_map, f)

# ── Train/Test split ───────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)
print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

# ── Train Random Forest model ──────────────────────────────
print("\n🌲 Training Random Forest Classifier...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=3,
    random_state=42,
    n_jobs=-1,
    verbose=1
)
model.fit(X_train, y_train)

# ── Evaluate ───────────────────────────────────────────────
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n✅ Test Accuracy: {acc*100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# ── Save model ─────────────────────────────────────────────
model_path = os.path.join(MODEL_DIR, 'cashew_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(model, f)
print(f"✅ Model saved to {model_path}")

# ── Plot feature importances ───────────────────────────────
plt.figure(figsize=(8,4))
plt.bar(range(10), sorted(model.feature_importances_, reverse=True)[:10])
plt.title('Top 10 Feature Importances')
plt.xlabel('Feature index')
plt.ylabel('Importance')
plt.tight_layout()
plt.savefig(os.path.join(MODEL_DIR, 'feature_importance.png'))
print("📊 Plot saved to model/feature_importance.png")

print("\n🎉 Training complete!")
print(f"   Model accuracy: {acc*100:.2f}%")
print("👉 Now run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
