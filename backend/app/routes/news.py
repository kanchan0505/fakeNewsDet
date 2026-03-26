from fastapi import APIRouter
from app.services.news_service import get_demo_news
from app.services.db_service import get_demo_articles_from_db

router = APIRouter()


@router.get("/news")
def get_news():
    try:
        articles = get_demo_articles_from_db()
        if articles:
            return articles
    except Exception:
        pass
    return get_demo_news()
