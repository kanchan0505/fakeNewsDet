import pickle
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "..", "model")

_model = None
_vectorizer = None


def _load_model():
    global _model, _vectorizer
    if _model is None or _vectorizer is None:
        model_path = os.path.join(MODEL_DIR, "model.pkl")
        vectorizer_path = os.path.join(MODEL_DIR, "vectorizer.pkl")
        with open(model_path, "rb") as f:
            _model = pickle.load(f)
        with open(vectorizer_path, "rb") as f:
            _vectorizer = pickle.load(f)


def _preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def predict(text: str) -> dict:
    _load_model()
    cleaned = _preprocess(text)
    tfidf = _vectorizer.transform([cleaned])
    prediction = _model.predict(tfidf)[0]
    probabilities = _model.predict_proba(tfidf)[0]
    confidence = float(probabilities[prediction])
    label = "real" if prediction == 1 else "fake"
    return {"label": label, "confidence": round(confidence, 4)}
