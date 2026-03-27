import json
import os
import urllib.request
import urllib.parse
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import RedirectResponse
from app.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    get_user_by_email,
    get_user_by_id,
    create_user,
    get_or_create_google_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
GOOGLE_REDIRECT_URI = f"{BACKEND_URL}/auth/google/callback"



def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not req.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = get_user_by_email(req.email.strip().lower())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    pwd_hash = hash_password(req.password)
    user = create_user(name=req.name.strip(), email=req.email.strip().lower(), password_hash=pwd_hash)
    token = create_access_token(user["id"])
    return {"access_token": token, "user": user}


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    user = get_user_by_email(req.email.strip().lower())
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=401,
            detail="This account uses Google sign-in. Please sign in with Google.",
        )
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["id"])
    return {
        "access_token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "avatar_url": user.get("avatar_url"),
        },
    }


@router.get("/google")
def google_login():
    """Redirect the browser to Google's OAuth consent screen."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)


@router.get("/google/callback")
def google_callback(code: str = None, error: str = None):
    """Handle the OAuth2 code callback from Google."""
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/signin?error=google_cancelled")

    # Exchange authorization code for tokens
    token_body = urllib.parse.urlencode({
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }).encode()

    try:
        token_req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=token_body,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        with urllib.request.urlopen(token_req) as resp:
            tokens = json.loads(resp.read().decode())
    except Exception:
        return RedirectResponse(f"{FRONTEND_URL}/signin?error=google_token_failed")

    access_token = tokens.get("access_token")
    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}/signin?error=google_token_failed")

    # Fetch user info from Google
    try:
        userinfo_req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(userinfo_req) as resp:
            userinfo = json.loads(resp.read().decode())
    except Exception:
        return RedirectResponse(f"{FRONTEND_URL}/signin?error=google_userinfo_failed")

    google_id = userinfo.get("sub")
    email = userinfo.get("email")
    if not google_id or not email:
        return RedirectResponse(f"{FRONTEND_URL}/signin?error=google_userinfo_failed")

    name = userinfo.get("name", email.split("@")[0])
    avatar_url = userinfo.get("picture")

    user = get_or_create_google_user(
        google_id=google_id, name=name, email=email, avatar_url=avatar_url
    )
    jwt_token = create_access_token(user["id"])
    # Redirect to the frontend callback page with the JWT as a query param
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={jwt_token}")


@router.get("/me", response_model=UserResponse)
def me(authorization: str = Header(None)):
    user = get_current_user(authorization)
    return user
