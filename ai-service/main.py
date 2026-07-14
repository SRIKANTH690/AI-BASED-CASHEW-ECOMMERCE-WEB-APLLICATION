"""
FastAPI AI Microservice
Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import predict as predictor

app = FastAPI(title="Cashew Quality AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
def startup():
    try:
        predictor.load_model()
    except FileNotFoundError as e:
        print(f"⚠️  {e}")
        print("   Run 'python train.py' to train the model first.")

@app.get("/")
def root():
    return {"status": "Cashew AI service running", "model_loaded": predictor.model is not None}

@app.get("/health")
def health():
    return {"status": "ok", "model_ready": predictor.model is not None}

@app.post("/predict")
async def predict_cashew(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    if predictor.model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run train.py first.")
    try:
        image_bytes = await file.read()
        result = predictor.predict(image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
