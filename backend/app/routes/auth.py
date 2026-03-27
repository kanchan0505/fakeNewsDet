import json
import urllib.request
from fastapi import APIRouter, HTTPException, Header
from app.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
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


@router.post("/google", response_model=TokenResponse)
def google_auth(req: GoogleAuthRequest):
    # Verify the access token by fetching user info from Google
    try:
        google_req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {req.access_token}"},
        )
        with urllib.request.urlopen(google_req) as response:
            userinfo = json.loads(response.read().decode())
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_id = userinfo.get("sub")
    email = userinfo.get("email")
    if not google_id or not email:
        raise HTTPException(status_code=401, detail="Could not retrieve Google account info")

    name = userinfo.get("name", email.split("@")[0])
    avatar_url = userinfo.get("picture")

    user = get_or_create_google_user(
        google_id=google_id, name=name, email=email, avatar_url=avatar_url
    )
    token = create_access_token(user["id"])
    return {"access_token": token, "user": user}


@router.get("/me", response_model=UserResponse)
def me(authorization: str = Header(None)):
    user = get_current_user(authorization)
    return user
