import pickle
import os
import re
import numpy as np
from collections import Counter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "..", "model")

_model = None
_scaler = None
_config = None


def _load_model():
    global _model, _scaler, _config
    if _model is None:
        with open(os.path.join(MODEL_DIR, "model.pkl"), "rb") as f:
            _model = pickle.load(f)
        with open(os.path.join(MODEL_DIR, "scaler.pkl"), "rb") as f:
            _scaler = pickle.load(f)
        with open(os.path.join(MODEL_DIR, "config.pkl"), "rb") as f:
            _config = pickle.load(f)


def _preprocess(text: str) -> str:
    text = str(text)
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"\S+@\S+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


FORMAL_WORDS = {
    "furthermore", "moreover", "consequently", "additionally", "nevertheless",
    "subsequently", "thereby", "accordingly", "thus", "hence", "therefore",
    "comprehensive", "unprecedented", "paradigm", "multifaceted", "imperative",
    "efficacy", "leveraging", "utilizing", "encompassing", "facilitating",
    "methodology", "framework", "implementation", "optimization", "systematic",
    "demonstrate", "significant", "substantial", "fundamental", "establish",
    "contribute", "facilitate", "objective", "mechanisms",
}

CONTRACTIONS = {
    "i'm", "don't", "doesn't", "didn't", "can't", "won't", "wouldn't",
    "couldn't", "shouldn't", "isn't", "aren't", "wasn't", "it's", "that's",
    "there's", "we're", "they're", "you're", "gonna", "wanna", "gotta",
    "kinda", "i've", "you've", "we've", "they've", "i'll", "you'll",
    "we'll", "they'll", "i'd", "you'd",
}

FILLER_WORDS = {
    "like", "honestly", "basically", "literally", "actually", "really",
    "just", "totally", "anyway", "though", "lol", "haha", "well", "okay",
    "ok", "um", "uh", "right", "yeah",
}

NARRATIVE_WORDS = {
    "remember", "felt", "saw", "heard", "thought", "knew", "realized",
    "noticed", "walked", "ran", "looked", "told", "asked", "laughed",
    "cried", "smiled",
}

HEDGING_WORDS = {
    "maybe", "perhaps", "probably", "might", "possibly", "somewhat",
    "fairly", "rather", "quite", "sort", "kind", "guess", "suppose",
    "seem", "seems", "apparently",
}

FORMAL_TRANSITIONS = {
    "however", "therefore", "furthermore", "moreover", "additionally",
    "consequently", "nevertheless", "nonetheless", "accordingly",
    "subsequently", "hence", "thus",
}


def _extract_stylistic_features(text: str) -> list:
    """Extract 28 domain-independent stylistic features (must match train.py)."""
    text = str(text)
    words = text.split()
    wc = max(len(words), 1)
    wl = [w.lower() for w in words]

    sents = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    sc = max(len(sents), 1)
    sl = [len(s.split()) for s in sents]

    word_lens = [len(w) for w in words]
    avg_wl = np.mean(word_lens) if word_lens else 0
    std_wl = np.std(word_lens) if word_lens else 0
    long_words = sum(1 for l in word_lens if l > 8) / wc
    short_words = sum(1 for l in word_lens if l <= 3) / wc

    starters = [s.split()[0].lower() for s in sents if s.split()]
    starter_diversity = len(set(starters)) / max(len(starters), 1)

    word_freq = Counter(wl)
    hapax = sum(1 for w, c in word_freq.items() if c == 1) / max(len(word_freq), 1)

    return [
        np.mean(sl) if sl else 0,
        np.std(sl) if len(sl) > 1 else 0,
        len(set(wl)) / wc,
        avg_wl,
        sum(1 for c in text if c in '.,;:!?') / max(len(text), 1),
        sum(1 for w in wl if w in CONTRACTIONS) / wc,
        sum(1 for w in wl if w in FORMAL_WORDS) / wc,
        sum(1 for w in wl if w in {'i','me','my','mine','myself','we','our','us'}) / wc,
        sum(1 for w in wl if w in FILLER_WORDS) / wc,
        text.count('?') / sc,
        text.count('!') / sc,
        text.count(',') / wc,
        len(text),
        (np.std(sl) / np.mean(sl)) if sl and np.mean(sl) > 0 else 0,
        sum(1 for s in sents if s and s[0].isupper()) / sc,
        long_words,
        short_words,
        starter_diversity,
        hapax,
        sum(1 for w in wl if w in NARRATIVE_WORDS) / wc,
        sum(1 for w in wl if w in HEDGING_WORDS) / wc,
        sum(1 for w in wl if w in FORMAL_TRANSITIONS) / wc,
        text.count('"') / max(len(text), 1),
        text.count('-') / max(len(text), 1),
        text.count('(') / sc,
        (text.count('\n\n') + 1) / sc,
        std_wl,
        float(sc),
    ]


def predict(text: str) -> dict:
    _load_model()
    cleaned = _preprocess(text)

    feat = np.array([_extract_stylistic_features(cleaned)])
    np.nan_to_num(feat, copy=False, nan=0.0)
    feat_scaled = _scaler.transform(feat)

    probabilities = _model.predict_proba(feat_scaled)[0]
    prediction = int(probabilities.argmax())
    confidence = float(probabilities[prediction])

    threshold = _config.get("uncertainty_threshold", 0.6)
    label_map = _config.get("label_map", {0: "human-written", 1: "ai-generated"})

    if confidence < threshold:
        label = "uncertain"
    else:
        label = label_map.get(prediction, "uncertain")

    return {"label": label, "confidence": round(confidence, 4)}
