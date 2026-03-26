import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/fake_news_detection"
)


def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def save_prediction(input_text: str, label: str, confidence: float):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO predictions (input_text, label, confidence) VALUES (%s, %s, %s) RETURNING id",
                (input_text, label, confidence),
            )
            result = cur.fetchone()
            conn.commit()
            return result["id"]
    finally:
        conn.close()


def get_prediction_history(limit: int = 50):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, input_text, label, confidence, created_at FROM predictions ORDER BY created_at DESC LIMIT %s",
                (limit,),
            )
            return cur.fetchall()
    finally:
        conn.close()


def get_demo_articles_from_db():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, content FROM demo_articles ORDER BY id")
            return cur.fetchall()
    finally:
        conn.close()
