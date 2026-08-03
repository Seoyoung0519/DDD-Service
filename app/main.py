# ✅ main.py 수정사항 - 배너 크롤러 스케줄러 통합

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from contextlib import asynccontextmanager

# 기존 라우터들...
from app.routers.user import router as user_router
from app.routers.onboarding import router as onboarding_router
from app.routers.onboarding_state import router as onboarding_state_router
from app.routers.proofs import router as proofs_router
from app.routers.keyrings import router as keyrings_router
from app.routers.user_books import router as user_books_router
from app.routers.badges import router as badges_router
from app.routers.feed import router as feed_router
from app.routers.reviews import router as reviews_router
from app.routers.library import router as library_router
from app.routers.settings import router as settings_router
from app.routers.agreements import router as agreements_router
from app.routers.notices import router as notices_router
# ✅ 추가
from app.routers.banners import router as banners_router

# ✅ 스케줄러 import
from app.crawlers.scheduler import scheduler


# ✅ 앱 시작/종료 시 스케줄러 관리
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱 시작 시
    print("\n" + "=" * 50)
    print("🚀 Daedokdan API Starting")
    print("=" * 50)

    # 스케줄러 시작
    scheduler.start()

    yield

    # 앱 종료 시
    scheduler.stop()
    print("\n" + "=" * 50)
    print("⛔ Daedokdan API Shutting down")
    print("=" * 50)


app = FastAPI(
    title="Daedokdan",
    lifespan=lifespan,  # ✅ lifespan 설정
)


@app.get("/")
def root():
    return {"service": "Daedokdan API running"}


@app.get("/health")
def health():
    return {"ok": True}


# 기존 라우터들...
app.include_router(user_router)
app.include_router(onboarding_router)
app.include_router(onboarding_state_router)
app.include_router(proofs_router)
app.include_router(keyrings_router)
app.include_router(user_books_router)
app.include_router(badges_router)
app.include_router(feed_router)
app.include_router(reviews_router)
app.include_router(library_router)
app.include_router(settings_router)
app.include_router(agreements_router)
app.include_router(notices_router)
# ✅ 추가
app.include_router(banners_router)


# ✅ 관리자용: 수동 크롤링 엔드포인트 (테스트/응급용)
@app.post("/admin/crawl-now")
def trigger_crawl_now():
    """
    관리자 전용: 크롤러를 즉시 실행
    (스케줄을 기다리지 않고 바로 실행)

    응급상황이나 테스트 시 사용
    """
    try:
        results = scheduler.run_once()
        return {
            "success": True,
            "message": "Crawlers executed",
            "results": results,
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e),
        }
