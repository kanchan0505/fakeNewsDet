import os
import jwt
from datetime import datetime, timedelta, timezone
from passlib.hash import bcrypt
from dotenv import load_dotenv
from app.services.db_service import get_connection

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72


def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_by_email(email: str):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            return cur.fetchone()
    finally:
        conn.close()


def get_user_by_id(user_id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, email, avatar_url, created_at FROM users WHERE id = %s",
                (user_id,),
            )
            return cur.fetchone()
    finally:
        conn.close()


def create_user(name: str, email: str, password_hash: str = None, google_id: str = None, avatar_url: str = None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (name, email, password_hash, google_id, avatar_url) VALUES (%s, %s, %s, %s, %s) RETURNING id, name, email, avatar_url",
                (name, email, password_hash, google_id, avatar_url),
            )
            result = cur.fetchone()
            conn.commit()
            return result
    finally:
        conn.close()


def get_or_create_google_user(google_id: str, name: str, email: str, avatar_url: str = None):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Check if user exists by google_id
            cur.execute(
                "SELECT id, name, email, avatar_url FROM users WHERE google_id = %s",
                (google_id,),
            )
            user = cur.fetchone()
            if user:
                return user

            # Check if user exists by email (registered with password first)
            cur.execute(
                "SELECT id, name, email, avatar_url, google_id FROM users WHERE email = %s",
                (email,),
            )
            user = cur.fetchone()
            if user:
                # Link Google account to existing user
                cur.execute(
                    "UPDATE users SET google_id = %s, avatar_url = COALESCE(avatar_url, %s) WHERE id = %s RETURNING id, name, email, avatar_url",
                    (google_id, avatar_url, user["id"]),
                )
                updated = cur.fetchone()
                conn.commit()
                return updated

            # Create new user
            cur.execute(
                "INSERT INTO users (name, email, google_id, avatar_url) VALUES (%s, %s, %s, %s) RETURNING id, name, email, avatar_url",
                (name, email, google_id, avatar_url),
            )
            new_user = cur.fetchone()
            conn.commit()
            return new_user
    finally:
        conn.close()
