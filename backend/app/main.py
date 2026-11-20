"""Prediction API backed by the supplied scikit-learn model."""
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any
from uuid import uuid4

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
model: Any = None
label_encoder: Any = None
symptom_columns: list[str] = []


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model, label_encoder, symptom_columns
    paths = [MODEL_DIR / name for name in (
        "disease_model.pkl", "label_encoder.pkl", "symptom_columns.pkl"
    )]
    missing = [path.name for path in paths if not path.is_file()]
    if missing:
        raise RuntimeError(f"Missing model file(s) in {MODEL_DIR}: {', '.join(missing)}")

    model, label_encoder, loaded_columns = [joblib.load(path) for path in paths]
    symptom_columns = list(loaded_columns)
    if len(symptom_columns) != 132 or len(set(symptom_columns)) != len(symptom_columns):
        raise RuntimeError("symptom_columns.pkl must contain 132 unique symptom names.")
    expected = getattr(model, "n_features_in_", len(symptom_columns))
    if expected != len(symptom_columns):
        raise RuntimeError(f"The model expects {expected} features, but the symptom list has {len(symptom_columns)}.")
    model_names = getattr(model, "feature_names_in_", None)
    if model_names is not None and list(model_names) != symptom_columns:
        raise RuntimeError("The symptom list order does not match the model's training feature order.")
    yield


app = FastAPI(title="Clarity Health API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class PredictionRequest(BaseModel):
    symptoms: list[str] = Field(min_length=1, max_length=132)
    notes: str | None = Field(default=None, max_length=1000)


@app.get("/health")
def health():
    return {"status": "ok", "model_ready": model is not None}


@app.get("/symptoms")
def get_symptoms():
    if not symptom_columns:
        raise HTTPException(status_code=503, detail="The model symptom list is not loaded.")
    return {"symptoms": symptom_columns}


@app.post("/predict")
def predict(payload: PredictionRequest):
    if model is None or label_encoder is None or not symptom_columns:
        raise HTTPException(status_code=503, detail="The prediction model is not ready.")
    if len(payload.symptoms) != len(set(payload.symptoms)):
        raise HTTPException(status_code=422, detail="Remove duplicate symptoms and try again.")
    unknown = sorted(set(payload.symptoms) - set(symptom_columns))
    if unknown:
        raise HTTPException(status_code=422, detail={"message": "Unknown symptom name.", "unknown": unknown})

    selected = set(payload.symptoms)
    row = pd.DataFrame([[int(name in selected) for name in symptom_columns]], columns=symptom_columns)
    try:
        predicted_class = model.predict(row)[0]
        disease = str(label_encoder.inverse_transform([predicted_class])[0])
        confidence = None
        if callable(getattr(model, "predict_proba", None)):
            confidence = round(float(model.predict_proba(row)[0].max()) * 100, 1)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="The model could not analyze this selection.") from exc

    return {
        "id": str(uuid4()),
        "disease": disease,
        "symptoms": payload.symptoms,
        "notes": (payload.notes or "").strip(),
        "confidence": confidence,
    }
