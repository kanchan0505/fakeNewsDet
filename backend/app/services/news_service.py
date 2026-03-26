import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEMO_PATH = os.path.join(BASE_DIR, "..", "..", "data", "demo.json")

_articles = None


def get_demo_news() -> list:
    global _articles
    if _articles is None:
        with open(DEMO_PATH, "r") as f:
            _articles = json.load(f)
    return _articles
