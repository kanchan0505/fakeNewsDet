"""
Fake News Detection — trainer.

Trains a TF-IDF + LogisticRegression classifier on one or more CSV files.
Each CSV must have two columns: `label` (REAL/FAKE or 0/1) and `text`.

You can re-train by simply adding more CSV paths to DATASET_PATHS below
and running:

    python -m model.train_news        # from backend/
    # or
    python model/train_news.py        # from backend/

Artifacts written next to this file:
    news_model.pkl, news_vectorizer.pkl, news_config.pkl
"""

import os
import re
import pickle

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.utils import shuffle


# ============================================
# Paths — add more datasets here to combine training data
# ============================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))

DATASET_PATHS = [
    os.path.join(PROJECT_ROOT, "news_dataset.csv"),
    # os.path.join(PROJECT_ROOT, "more_news.csv"),  # add more datasets here
]


# ============================================
# 1. Load + normalise dataset(s)
# ============================================
def _normalise_label(v):
    s = str(v).strip().upper()
    if s in ("FAKE", "0", "FALSE", "F"):
        return 0
    if s in ("REAL", "1", "TRUE", "T"):
        return 1
    return None


def load_datasets(paths):
    frames = []
    for p in paths:
        if not os.path.exists(p):
            print(f"  [skip] not found: {p}")
            continue
        df = pd.read_csv(p)
        cols = {c.lower(): c for c in df.columns}
        if "label" not in cols or "text" not in cols:
            print(f"  [skip] missing label/text columns: {p}")
            continue
        df = df.rename(columns={cols["label"]: "label", cols["text"]: "text"})
        df = df[["label", "text"]].dropna()
        df["label"] = df["label"].map(_normalise_label)
        df = df.dropna(subset=["label"])
        df["label"] = df["label"].astype(int)
        print(f"  loaded {len(df):>6d} rows from {os.path.basename(p)}")
        frames.append(df)
    if not frames:
        raise SystemExit("No valid datasets found.")
    return pd.concat(frames, ignore_index=True)


print("Loading news datasets...")
df = load_datasets(DATASET_PATHS)
print(f"  Total: {len(df)}  (FAKE={int((df['label']==0).sum())}, REAL={int((df['label']==1).sum())})")


# ============================================
# 2. Light preprocessing (preserve content signals)
# ============================================
URL_RE = re.compile(r"http\S+|www\.\S+")
WS_RE = re.compile(r"\s+")


def preprocess(text):
    text = str(text)
    text = URL_RE.sub(" ", text)
    text = WS_RE.sub(" ", text).strip()
    return text


df["text"] = df["text"].apply(preprocess)
df = df[df["text"].str.len() > 30].reset_index(drop=True)
print(f"  After cleanup: {len(df)}")


# ============================================
# 3. Balance classes (downsample majority)
# ============================================
fake = df[df["label"] == 0]
real = df[df["label"] == 1]
n = min(len(fake), len(real))
if n == 0:
    raise SystemExit("Dataset must contain both REAL and FAKE samples.")

df = pd.concat([
    fake.sample(n=n, random_state=42),
    real.sample(n=n, random_state=42),
], ignore_index=True)
df = shuffle(df, random_state=42).reset_index(drop=True)
print(f"  Balanced: {len(df)} ({n} per class)")


# ============================================
# 4. Train/test split
# ============================================
X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
)
print(f"  Train: {len(X_train)}, Test: {len(X_test)}")


# ============================================
# 5. TF-IDF + LogisticRegression
# ============================================
print("Vectorising (TF-IDF, 1-2 grams)...")
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=50000,
    min_df=2,
    max_df=0.95,
    sublinear_tf=True,
    strip_accents="unicode",
    lowercase=True,
)
Xtr = vectorizer.fit_transform(X_train)
Xte = vectorizer.transform(X_test)
print(f"  Features: {Xtr.shape[1]}")

print("Training LogisticRegression...")
model = LogisticRegression(
    C=4.0,
    max_iter=2000,
    n_jobs=-1,
    class_weight="balanced",
    solver="liblinear",
)
model.fit(Xtr, y_train)


# ============================================
# 6. Evaluation
# ============================================
y_pred = model.predict(Xte)
y_proba = model.predict_proba(Xte)

print("\n" + "=" * 50)
print("MODEL EVALUATION — Fake News Detection")
print("=" * 50)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print()
print(classification_report(y_test, y_pred, target_names=["FAKE (0)", "REAL (1)"]))

cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:")
print(f"  TN (FAKE correct)={cm[0][0]:6d}   FP (FAKE as REAL)={cm[0][1]:6d}")
print(f"  FN (REAL as FAKE)={cm[1][0]:6d}   TP (REAL correct)={cm[1][1]:6d}")

max_proba = np.max(y_proba, axis=1)
UNCERTAINTY_THRESHOLD = 0.6
uncertain = int(np.sum(max_proba < UNCERTAINTY_THRESHOLD))
print(f"\nMean confidence: {float(np.mean(max_proba)):.4f}")
print(f"Uncertain (<{UNCERTAINTY_THRESHOLD}): {uncertain}/{len(max_proba)} ({100*uncertain/len(max_proba):.1f}%)")


# ============================================
# 7. Save artifacts
# ============================================
config = {
    "uncertainty_threshold": UNCERTAINTY_THRESHOLD,
    "label_map": {0: "fake", 1: "real"},
}

with open(os.path.join(BASE_DIR, "news_model.pkl"), "wb") as f:
    pickle.dump(model, f)
with open(os.path.join(BASE_DIR, "news_vectorizer.pkl"), "wb") as f:
    pickle.dump(vectorizer, f)
with open(os.path.join(BASE_DIR, "news_config.pkl"), "wb") as f:
    pickle.dump(config, f)

print(f"\nSaved news_model.pkl, news_vectorizer.pkl, news_config.pkl in {BASE_DIR}")


# ============================================
# 8. Quick sanity check on a few samples
# ============================================
samples = [
    ("REAL", "The Reserve Bank of India today announced a 25 basis point cut in the repo rate, bringing it to 6.25%, citing easing inflation pressures and the need to support growth."),
    ("FAKE", "BREAKING: A viral WhatsApp forward claims that drinking hot lemon water can cure COVID-19 within hours. The forward, attributed to a fake doctor, has been debunked by experts."),
    ("REAL", "India's Chandrayaan-3 mission successfully soft-landed near the lunar south pole, making India the first country to achieve a landing in this region."),
    ("FAKE", "A photoshopped image of a politician shaking hands with a celebrity at a fake event is circulating widely on social media with misleading captions."),
]
print("\nSanity check:")
for expected, t in samples:
    proba = model.predict_proba(vectorizer.transform([preprocess(t)]))[0]
    pred = int(proba.argmax())
    label = config["label_map"][pred]
    conf = float(proba[pred])
    ok = "OK" if (expected == "REAL" and pred == 1) or (expected == "FAKE" and pred == 0) else "WRONG"
    print(f"  [{ok}] expected={expected:4s} predicted={label:4s} ({conf*100:.1f}%) | {t[:70]}...")

print("\nDone.")
