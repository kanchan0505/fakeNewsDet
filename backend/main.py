from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict, news, auth

app = FastAPI(title="AI vs Human Text Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
