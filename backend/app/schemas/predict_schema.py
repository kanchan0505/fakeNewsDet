from typing import List, Optional
from pydantic import BaseModel


class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    label: str  # "ai-generated", "human-written", or "uncertain"
    confidence: float


class NewsPredictRequest(BaseModel):
    text: str


class FactCheckClaim(BaseModel):
    claim: str = ""
    claimant: str = ""
    rating: str = ""
    publisher: str = ""
    url: str = ""
    review_date: str = ""
    verdict: str = ""


class NewsPredictResponse(BaseModel):
    label: str  # "real", "fake", or "uncertain"
    confidence: float
    claims: Optional[List[FactCheckClaim]] = None
    matches: Optional[int] = None
    error: Optional[str] = None
    reason: Optional[str] = None
    used_broad_query: Optional[bool] = None
