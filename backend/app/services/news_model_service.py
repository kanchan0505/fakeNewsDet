import os
import re
import pickle

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "..", "model")

_model = None
_vectorizer = None
_config = None


def _load():
    global _model, _vectorizer, _config
    if _model is None:
        with open(os.path.join(MODEL_DIR, "news_model.pkl"), "rb") as f:
            _model = pickle.load(f)
        with open(os.path.join(MODEL_DIR, "news_vectorizer.pkl"), "rb") as f:
            _vectorizer = pickle.load(f)
        with open(os.path.join(MODEL_DIR, "news_config.pkl"), "rb") as f:
            _config = pickle.load(f)


_URL = re.compile(r"http\S+|www\.\S+")
_WS = re.compile(r"\s+")


def _preprocess(text: str) -> str:
    text = str(text)
    text = _URL.sub(" ", text)
    text = _WS.sub(" ", text).strip()
    return text


def predict_news(text: str) -> dict:
    _load()
    cleaned = _preprocess(text)
    X = _vectorizer.transform([cleaned])
    proba = _model.predict_proba(X)[0]
    pred = int(proba.argmax())
    confidence = float(proba[pred])

    threshold = _config.get("uncertainty_threshold", 0.6)
    label_map = _config.get("label_map", {0: "fake", 1: "real"})

    if confidence < threshold:
        label = "uncertain"
    else:
        label = label_map.get(pred, "uncertain")

    return {"label": label, "confidence": round(confidence, 4)}
