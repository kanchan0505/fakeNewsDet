import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict, news, auth

app = FastAPI(title="AI vs Human Text Detection API")

_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001",
)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(news.router)


@app.get("/")
def root():
    return {"message": "AI vs Human Text Detection API is running"}
