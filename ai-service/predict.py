"""
predict.py — Load trained model and predict cashew grade
"""
import os, json, pickle
import numpy as np
from PIL import Image

MODEL_DIR    = os.path.join(os.path.dirname(__file__), 'model')
MODEL_PATH   = os.path.join(MODEL_DIR, 'cashew_model.pkl')
ENCODER_PATH = os.path.join(MODEL_DIR, 'label_encoder.pkl')
IMG_SIZE     = (64, 64)

# Quality score per grade
GRADE_QUALITY = {
    'W180': 95, 'W210': 90, 'W240': 85,
    'W450': 75, 'WBB': 65,  'WBROKEN': 60
}

model   = None
encoder = None

def load_model():
    global model, encoder
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run train.py first."
        )
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(ENCODER_PATH, 'rb') as f:
        encoder = pickle.load(f)
    print(f"✅ Model loaded. Classes: {list(encoder.classes_)}")

def extract_features(image_bytes: bytes) -> np.ndarray:
    from io import BytesIO
    img = Image.open(BytesIO(image_bytes)).convert('RGB')
    img = img.resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    hist_r = np.histogram(arr[:,:,0], bins=16, range=(0,1))[0]
    hist_g = np.histogram(arr[:,:,1], bins=16, range=(0,1))[0]
    hist_b = np.histogram(arr[:,:,2], bins=16, range=(0,1))[0]
    stats  = [arr[:,:,0].mean(), arr[:,:,0].std(),
              arr[:,:,1].mean(), arr[:,:,1].std(),
              arr[:,:,2].mean(), arr[:,:,2].std()]
    features = np.concatenate([hist_r, hist_g, hist_b, stats])
    return features.reshape(1, -1)

def predict(image_bytes: bytes) -> dict:
    if model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")

    features   = extract_features(image_bytes)
    pred_idx   = model.predict(features)[0]
    pred_proba = model.predict_proba(features)[0]

    grade      = encoder.inverse_transform([pred_idx])[0]
    confidence = float(pred_proba[pred_idx]) * 100

    base_score    = GRADE_QUALITY.get(grade, 70)
    quality_score = round(min(base_score * (confidence / 100) * 1.05, 100.0), 1)

    return {
        "grade":           grade,
        "quality_score":   quality_score,
        "confidence":      round(confidence, 2),
        "predicted_class": grade
    }
