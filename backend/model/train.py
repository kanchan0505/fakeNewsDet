import pandas as pd
import re
import pickle
import os
import numpy as np
from collections import Counter
from sklearn.model_selection import train_test_split
from sklearn.linear_model import SGDClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.utils import shuffle

# ============================================
# Paths
# ============================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "..", "AI_Human.csv")

# ============================================
# 1. Load AI vs Human Dataset
# ============================================
print("Loading AI vs Human dataset...")
df = pd.read_csv(DATASET_PATH)

# Columns: text, generated (0 = Human-written, 1 = AI-generated)
df = df.rename(columns={"text": "content", "generated": "label"})
df["label"] = df["label"].astype(float).astype(int)  # 0 = Human, 1 = AI

print(f"  Total samples: {len(df)}")
print(f"  Human-written (0): {(df['label']==0).sum()}")
print(f"  AI-generated (1): {(df['label']==1).sum()}")

# ============================================
# 2. Balance & Subsample Dataset
# ============================================
print("Balancing dataset...")
human_df = df[df["label"] == 0]
ai_df = df[df["label"] == 1]
min_count = min(len(ai_df), len(human_df))

ai_df = ai_df.sample(n=min_count, random_state=42)
human_df = human_df.sample(n=min_count, random_state=42)

df = pd.concat([human_df, ai_df], ignore_index=True)
df = shuffle(df, random_state=42).reset_index(drop=True)
print(f"  Balanced: {len(df)} total ({(df['label']==0).sum()} Human, {(df['label']==1).sum()} AI)")

# Subsample for faster training
MAX_PER_CLASS = 50000
if (df['label']==0).sum() > MAX_PER_CLASS:
    df = pd.concat([
        df[df['label']==0].sample(n=MAX_PER_CLASS, random_state=42),
        df[df['label']==1].sample(n=MAX_PER_CLASS, random_state=42),
    ], ignore_index=True)
    df = shuffle(df, random_state=42).reset_index(drop=True)
    print(f"  Subsampled: {len(df)} total for faster training")


# ============================================
# 3. Preprocessing (light — preserve style signals)
# ============================================
def preprocess(text):
    text = str(text)
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"\S+@\S+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ============================================
# 4. Stylistic Feature Extraction
#    Only domain-independent features — NO n-grams.
#    This ensures the model generalizes to any topic.
# ============================================
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


def extract_stylistic_features(text):
    """Extract 28 domain-independent stylistic features."""
    text = str(text)
    words = text.split()
    wc = max(len(words), 1)
    wl = [w.lower() for w in words]

    # Sentence analysis
    sents = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    sc = max(len(sents), 1)
    sl = [len(s.split()) for s in sents]

    # Word length distribution
    word_lens = [len(w) for w in words]
    avg_wl = np.mean(word_lens) if word_lens else 0
    std_wl = np.std(word_lens) if word_lens else 0
    long_words = sum(1 for l in word_lens if l > 8) / wc
    short_words = sum(1 for l in word_lens if l <= 3) / wc

    # Sentence starters diversity
    starters = [s.split()[0].lower() for s in sents if s.split()]
    starter_diversity = len(set(starters)) / max(len(starters), 1)

    # Hapax legomena ratio (words appearing only once)
    word_freq = Counter(wl)
    hapax = sum(1 for w, c in word_freq.items() if c == 1) / max(len(word_freq), 1)

    return [
        np.mean(sl) if sl else 0,                          # 0: avg_sent_len
        np.std(sl) if len(sl) > 1 else 0,                  # 1: sent_len_std
        len(set(wl)) / wc,                                 # 2: vocab_diversity
        avg_wl,                                             # 3: avg_word_len
        sum(1 for c in text if c in '.,;:!?') / max(len(text), 1),  # 4: punct_ratio
        sum(1 for w in wl if w in CONTRACTIONS) / wc,      # 5: contraction_ratio
        sum(1 for w in wl if w in FORMAL_WORDS) / wc,      # 6: formal_ratio
        sum(1 for w in wl if w in {'i','me','my','mine','myself','we','our','us'}) / wc,  # 7: first_person
        sum(1 for w in wl if w in FILLER_WORDS) / wc,      # 8: filler_ratio
        text.count('?') / sc,                               # 9: question_ratio
        text.count('!') / sc,                               # 10: exclaim_ratio
        text.count(',') / wc,                               # 11: comma_ratio
        len(text),                                          # 12: text_length
        (np.std(sl) / np.mean(sl)) if sl and np.mean(sl) > 0 else 0,  # 13: cv_sent_len
        sum(1 for s in sents if s and s[0].isupper()) / sc, # 14: caps_start
        long_words,                                         # 15: long_word_ratio
        short_words,                                        # 16: short_word_ratio
        starter_diversity,                                  # 17: sentence_starter_diversity
        hapax,                                              # 18: hapax_legomena_ratio
        sum(1 for w in wl if w in NARRATIVE_WORDS) / wc,   # 19: narrative_ratio
        sum(1 for w in wl if w in HEDGING_WORDS) / wc,     # 20: hedging_ratio
        sum(1 for w in wl if w in FORMAL_TRANSITIONS) / wc, # 21: formal_transition_ratio
        text.count('"') / max(len(text), 1),                # 22: quote_ratio
        text.count('-') / max(len(text), 1),                # 23: dash_ratio
        text.count('(') / sc,                               # 24: parenthetical_ratio
        (text.count('\n\n') + 1) / sc,                     # 25: para_to_sent_ratio
        std_wl,                                             # 26: word_len_std
        float(sc),                                          # 27: sentence_count
    ]


FEATURE_NAMES = [
    "avg_sent_len", "sent_len_std", "vocab_diversity", "avg_word_len",
    "punct_ratio", "contraction_ratio", "formal_ratio", "first_person",
    "filler_ratio", "question_ratio", "exclaim_ratio", "comma_ratio",
    "text_length", "cv_sent_len", "caps_start", "long_word_ratio",
    "short_word_ratio", "starter_diversity", "hapax_ratio",
    "narrative_ratio", "hedging_ratio", "formal_transition",
    "quote_ratio", "dash_ratio", "parenthetical", "para_to_sent",
    "word_len_std", "sentence_count",
]

print("Preprocessing...")
df["content"] = df["content"].apply(preprocess)
df = df[df["content"].str.len() > 20].reset_index(drop=True)
print(f"  After cleanup: {len(df)} samples")

# ============================================
# 5. Train/Test Split
# ============================================
X_train, X_test, y_train, y_test = train_test_split(
    df["content"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
)
print(f"  Train: {len(X_train)}, Test: {len(X_test)}")

# ============================================
# 6. Feature Extraction — Stylistic Features Only
# ============================================
print("Extracting stylistic features...")
X_train_feat = np.array([extract_stylistic_features(t) for t in X_train])
X_test_feat = np.array([extract_stylistic_features(t) for t in X_test])

# Replace any NaN (from empty texts) with 0
np.nan_to_num(X_train_feat, copy=False, nan=0.0)
np.nan_to_num(X_test_feat, copy=False, nan=0.0)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_feat)
X_test_scaled = scaler.transform(X_test_feat)

print(f"  Total features: {X_train_scaled.shape[1]}")

# ============================================
# 7. Train SGDClassifier
# ============================================
print("Training SGDClassifier...")
model = SGDClassifier(
    loss="modified_huber",
    max_iter=2000,
    tol=1e-4,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1,
    penalty="l2",
    alpha=1e-4,
)
model.fit(X_train_scaled, y_train)

# ============================================
# 8. Evaluation
# ============================================
y_pred = model.predict(X_test_scaled)
y_proba = model.predict_proba(X_test_scaled)

print("\n" + "=" * 50)
print("MODEL EVALUATION — AI vs Human Detection")
print("=" * 50)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print()
print("Classification Report:")
print(classification_report(y_test, y_pred, target_names=["Human-Written", "AI-Generated"]))

print("Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"  TN (Human correct)={cm[0][0]:6d}   FP (Human as AI) ={cm[0][1]:6d}")
print(f"  FN (AI as Human)  ={cm[1][0]:6d}   TP (AI correct)   ={cm[1][1]:6d}")

max_proba = np.max(y_proba, axis=1)
UNCERTAINTY_THRESHOLD = 0.6
uncertain_count = np.sum(max_proba < UNCERTAINTY_THRESHOLD)
print(f"\nConfidence Analysis:")
print(f"  Mean confidence: {np.mean(max_proba):.4f}")
print(f"  Uncertain predictions (< {UNCERTAINTY_THRESHOLD}): {uncertain_count}/{len(max_proba)} ({100*uncertain_count/len(max_proba):.1f}%)")

# ============================================
# 9. Save model artifacts
# ============================================
config = {
    "uncertainty_threshold": UNCERTAINTY_THRESHOLD,
    "label_map": {0: "human-written", 1: "ai-generated"},
}

with open(os.path.join(BASE_DIR, "model.pkl"), "wb") as f:
    pickle.dump(model, f)
with open(os.path.join(BASE_DIR, "scaler.pkl"), "wb") as f:
    pickle.dump(scaler, f)
with open(os.path.join(BASE_DIR, "config.pkl"), "wb") as f:
    pickle.dump(config, f)

print(f"\nModel, scaler, and config saved to {BASE_DIR}")

# ============================================
# 10. Generalization Test on Out-of-Domain Texts
# ============================================
print("\n" + "=" * 50)
print("GENERALIZATION TEST — Out-of-Domain Texts")
print("=" * 50)

test_texts = [
    ("AI", "Artificial intelligence represents a transformative force in contemporary society, fundamentally reshaping how organizations approach data analysis and decision-making processes. The integration of machine learning algorithms into business operations has engendered unprecedented efficiencies."),
    ("Human", "I still remember the day my grandmother handed me her recipe notebook. It was worn, pages yellowed and stained with decades of cooking. Inside were recipes written in her handwriting with little notes in the margins."),
    ("AI", "This comprehensive study evaluates the efficacy of novel approaches in processing temporal sequences. Our methodology employs a stratified cross-validation approach, yielding mean accuracy metrics of 94.7%. The findings substantiate the hypothesis that modern models outperform conventional implementations."),
    ("Human", "Honestly today was a total disaster. I woke up late, spilled coffee all over my shirt, and then realized I had the wrong meeting time. My boss gave me that look you know the one?"),
    ("Human", "Hey! Just checking in, did you get my last email about the project? I'm a bit worried we might be running behind. Also wanna grab coffee next week? Let me know what works for you!"),
    ("AI", "The global market for renewable energy solutions experienced unprecedented growth in fiscal year 2025, driven by declining production costs, supportive regulatory frameworks, and increasing corporate commitments to carbon neutrality."),
    ("Human", "My cat just knocked my water glass off the table for the third time today. I swear she does it on purpose. Every time I put it down she just stares at me and pushes it off."),
    ("AI", "In the rapidly evolving landscape of digital transformation, organizations must adopt comprehensive strategies to navigate the complexities of emerging technologies while maintaining operational resilience and sustainable growth trajectories."),
]

for expected, text in test_texts:
    cleaned = preprocess(text)
    feat = np.array([extract_stylistic_features(cleaned)])
    np.nan_to_num(feat, copy=False, nan=0.0)
    feat_scaled = scaler.transform(feat)
    proba = model.predict_proba(feat_scaled)[0]
    pred = int(proba.argmax())
    conf = float(proba[pred])
    label = config["label_map"][pred]
    status = "OK" if (expected == "AI" and pred == 1) or (expected == "Human" and pred == 0) else "WRONG"
    print(f"  [{status}] Expected={expected:5s} | Predicted={label:14s} ({conf*100:.1f}%) | {text[:60]}...")

print("\nTraining complete!")
