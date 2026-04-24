"""News verification via the Google Fact Check Tools API.

Replaces the previous TF-IDF model for the "News Detection" feature.
The AI vs Human text detection feature is unaffected.

Strategy:
  1. Try a focused query (first sentence / first 200 chars).
  2. If no fact-checks come back, fall back to a broader query made of
     proper-noun keywords from the input.
  3. If the input clearly matches a known hoax pattern (e.g. death-hoax
     "X is no more / dead / died") and we cannot find a fact-check that
     confirms it, we mark it as `fake` with moderate confidence and an
     explicit `reason` field so the UI can be transparent about why.
"""

import os
import re
import json
import urllib.parse
import urllib.request
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("FACT_CHECK_API")
ENDPOINT = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

# Textual ratings mapped to a coarse verdict.
_FAKE_TOKENS = {
    "false", "fake", "incorrect", "misleading", "miscaptioned",
    "mostly false", "pants on fire", "no evidence", "unproven",
    "manipulated", "altered", "mostly-false", "partly false",
    "partly-false", "misattributed", "scam", "hoax", "debunked",
}
_REAL_TOKENS = {
    "true", "correct", "mostly true", "mostly-true", "accurate",
    "verified", "confirmed",
}

# Common hoax patterns (case-insensitive). Each tuple = (regex, reason).
_HOAX_PATTERNS = [
    (re.compile(r"\b(is|are)\s+(no\s+more|dead|deceased)\b", re.I),
     "Classic death-hoax phrasing detected and no fact-check confirms it."),
    (re.compile(r"\b(has|have)\s+(passed\s+away|died)\b", re.I),
     "Death-hoax phrasing detected and no fact-check confirms it."),
    (re.compile(r"\b(died|passed\s+away)\s+(today|yesterday|this\s+morning)\b", re.I),
     "Death-hoax phrasing detected and no fact-check confirms it."),
    (re.compile(r"\bbreaking[: ].{0,80}\b(dead|died|killed)\b", re.I),
     "Sensational 'BREAKING' death claim with no fact-check support."),
]

_URL_RE = re.compile(r"http\S+|www\.\S+")
_WS_RE = re.compile(r"\s+")
_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "of", "in", "on", "at", "to", "for", "and", "or", "but", "if", "then",
    "this", "that", "these", "those", "it", "its", "he", "she", "they",
    "them", "his", "her", "their", "with", "by", "as", "from", "has",
    "have", "had", "no", "not", "more", "today", "yesterday",
}


def _clean(text: str) -> str:
    text = _URL_RE.sub(" ", str(text))
    text = _WS_RE.sub(" ", text).strip()
    return text


def _build_query(text: str) -> str:
    cleaned = _clean(text)
    if not cleaned:
        return ""
    first_sent = re.split(r"(?<=[.!?])\s+", cleaned, maxsplit=1)[0]
    q = first_sent if 10 <= len(first_sent) <= 200 else cleaned[:200]
    return q.strip()


def _build_broad_query(text: str) -> str:
    """Extract capitalised words / long content tokens for a broader search."""
    cleaned = _clean(text)
    if not cleaned:
        return ""
    # Prefer proper nouns (capitalised words not at sentence start position 0).
    proper = re.findall(r"\b[A-Z][a-zA-Z]{2,}\b", cleaned)
    proper = [w for w in proper if w.lower() not in _STOPWORDS]
    # Fall back to longest content words.
    if len(proper) < 2:
        tokens = [
            t for t in re.findall(r"[A-Za-z']{4,}", cleaned)
            if t.lower() not in _STOPWORDS
        ]
        tokens.sort(key=len, reverse=True)
        proper.extend(tokens[: max(0, 3 - len(proper))])
    # Deduplicate while preserving order.
    seen = set()
    out = []
    for w in proper:
        k = w.lower()
        if k not in seen:
            seen.add(k)
            out.append(w)
        if len(out) >= 4:
            break
    return " ".join(out).strip()


def _classify_rating(rating: Optional[str]) -> Optional[str]:
    if not rating:
        return None
    r = rating.strip().lower()
    if any(tok in r for tok in _FAKE_TOKENS):
        return "fake"
    if any(tok in r for tok in _REAL_TOKENS):
        return "real"
    return None


def _hoax_match(text: str) -> Optional[str]:
    for pattern, reason in _HOAX_PATTERNS:
        if pattern.search(text):
            return reason
    return None


def _call_api(query: str, language: str = "en") -> dict:
    if not API_KEY:
        raise RuntimeError("FACT_CHECK_API key is not set in the environment")
    params = {
        "query": query,
        "key": API_KEY,
        "languageCode": language,
        "pageSize": 10,
    }
    url = f"{ENDPOINT}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _score_claims(raw_claims: list) -> tuple[int, int, list[dict]]:
    fake = real = 0
    surfaced: list[dict] = []
    for claim in raw_claims:
        for review in claim.get("claimReview", []) or []:
            rating = review.get("textualRating")
            verdict = _classify_rating(rating)
            if verdict == "fake":
                fake += 1
            elif verdict == "real":
                real += 1
            if len(surfaced) < 5:
                publisher = review.get("publisher") or {}
                surfaced.append({
                    "claim": (claim.get("text") or "")[:300],
                    "claimant": claim.get("claimant", ""),
                    "rating": rating or "Unrated",
                    "publisher": publisher.get("name", ""),
                    "url": review.get("url", ""),
                    "review_date": review.get("reviewDate", ""),
                    "verdict": verdict or "unknown",
                })
    return fake, real, surfaced


def predict_news(text: str) -> dict:
    cleaned = _clean(text)
    if not cleaned:
        return {"label": "uncertain", "confidence": 0.0, "claims": []}

    query = _build_query(text)

    # ---- Step 1: focused query ----
    raw_claims: list = []
    error: Optional[str] = None
    try:
        data = _call_api(query)
        raw_claims = data.get("claims", []) or []
    except Exception as exc:
        error = str(exc)

    fake_count, real_count, surfaced = _score_claims(raw_claims)
    hoax_reason = _hoax_match(cleaned)

    # ---- Step 2: broader fallback if focused query found nothing rated ----
    # We only let broad-query hits drive the verdict when a hoax pattern is
    # present (otherwise generic keywords like "cereal" can match unrelated
    # debunks and produce false positives). For all other cases the broad
    # results are shown only as supporting context.
    used_broad = False
    broad_surfaced: list[dict] = []
    if fake_count + real_count == 0:
        broad = _build_broad_query(text)
        if broad and broad.lower() != query.lower():
            try:
                data2 = _call_api(broad)
                raw_claims2 = data2.get("claims", []) or []
                if raw_claims2:
                    used_broad = True
                    bf, br, bs = _score_claims(raw_claims2)
                    broad_surfaced = bs
                    if hoax_reason:
                        # Trust broad query for hoax inputs.
                        raw_claims = raw_claims2
                        fake_count, real_count, surfaced = bf, br, bs
            except Exception as exc:
                error = error or str(exc)

    total = fake_count + real_count

    # ---- Step 3a: rated fact-checks found ----
    if total > 0:
        if fake_count >= real_count:
            label = "fake"
            confidence = round(fake_count / total, 4)
        else:
            label = "real"
            confidence = round(real_count / total, 4)
        if total == 1:
            confidence = min(confidence, 0.7)

        # Hoax pattern + only fake-rated related claims → keep "fake" but bump
        # the explanation so the UI shows the heuristic.
        result = {
            "label": label,
            "confidence": confidence,
            "claims": surfaced,
            "matches": len(raw_claims),
            "used_broad_query": used_broad,
        }
        if hoax_reason and label == "fake":
            result["reason"] = hoax_reason
        return result

    # ---- Step 3b: no rated fact-checks. Apply hoax heuristic. ----
    if hoax_reason:
        confidence = 0.7 if (surfaced or broad_surfaced) else 0.6
        return {
            "label": "fake",
            "confidence": confidence,
            "claims": surfaced or broad_surfaced,
            "matches": len(raw_claims),
            "used_broad_query": used_broad,
            "reason": hoax_reason,
        }

    # ---- Step 3c: genuinely no signal. ----
    out = {
        "label": "uncertain",
        "confidence": 0.0,
        "claims": surfaced or broad_surfaced,
        "matches": len(raw_claims),
        "used_broad_query": used_broad,
    }
    if error:
        out["error"] = error
    return out
