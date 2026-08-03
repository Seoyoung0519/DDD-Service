from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.deps.auth import get_auth_context, get_db_client
from app.schemas.badges import KeyringBadgeCreateIn, KeyringBadgeOut
from app.services.keyring_badge_service import create_or_update_keyring_for_completed_book

router = APIRouter(prefix="/badges", tags=["badges"])
@router.post("/keyring", response_model=KeyringBadgeOut)
def create_keyring_badge(
    body: KeyringBadgeCreateIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]
    book_id = body.bookId

    # ✅ 디버그용 로그 추가
    print(f"[badges/keyring] user_id={user_id}, book_id={book_id}")

    ub = (
        sb.table("user_books")
        .select("status,current_page,end_page")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .limit(1)
        .execute()
        .data
    )

    # ✅ 실제 조회 결과 로그
    print(f"[badges/keyring] user_books result: {ub}")

    if not ub:
        raise HTTPException(
            status_code=400,
            detail=f"User does not have this book in shelf (user_id={user_id}, book_id={book_id})"
        )

    ub0 = ub[0]
    end_page = ub0.get("end_page")
    current_page = ub0.get("current_page") or 0

    page_based_completed = (
        end_page is not None
        and end_page > 0
        and current_page >= end_page
    )
    is_completed = ub0.get("status") == "completed" or page_based_completed

    # ✅ 완독 판정 로그
    print(f"[badges/keyring] status={ub0.get('status')}, current={current_page}, end={end_page}, is_completed={is_completed}")

    if not is_completed:
        raise HTTPException(
            status_code=409,
            detail=f"Book is not completed yet (status={ub0.get('status')}, current={current_page}, end={end_page})"
        )

    try:
        result = create_or_update_keyring_for_completed_book(sb, user_id, book_id)
    except HTTPException:
        raise
    except Exception as e:
        # ✅ 서비스 내부 에러를 500으로 명확히 노출
        print(f"[badges/keyring] UNEXPECTED ERROR: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Keyring creation failed: {repr(e)}")

    return KeyringBadgeOut(
        ok=True,
        bookId=book_id,
        keyringId=result["keyring_id"],
        prompt=result["prompt"],
        imageStatus=result["image_status"],
        imageUrl=result.get("image_url"),
        imagePath=result.get("image_path"),
        fallbackSvg=result.get("fallback_svg"),
    )