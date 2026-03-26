from fastapi import APIRouter
from app.schemas.predict_schema import PredictRequest, PredictResponse
from app.services.model_service import predict
from app.services.db_service import save_prediction, get_prediction_history

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
def predict_news(request: PredictRequest):
    result = predict(request.text)
    try:
        save_prediction(request.text, result["label"], result["confidence"])
    except Exception:
        pass  # DB is optional, don't break predictions if DB is down
    return result


@router.get("/history")
def prediction_history():
    try:
        return get_prediction_history()
    except Exception:
        return []
