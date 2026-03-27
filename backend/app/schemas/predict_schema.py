from pydantic import BaseModel


class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    label: str  # "ai-generated", "human-written", or "uncertain"
    confidence: float
