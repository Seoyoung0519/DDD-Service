from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.deps.auth import get_auth_context, get_db_client
from app.schemas.keyrings import KeyringListOut, KeyringOut, KeyringPromptOut
from app.services.keyring_prompt import build_keyring_prompt
from app.services.cover_features import extract_cover_features  # ✅ FIX: import 추가
from app.services.keyring_storage import signed_keyring_url
router = APIRouter(prefix="/keyrings", tags=["keyrings"])

@router.get("", response_model=KeyringListOut)
def list_my_keyrings(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
    limit: int = Query(default=50, ge=1, le=100),
):
    user_id = auth_ctx["user_id"]

    k_rows = (
            sb.table("keyrings")
            .select("id,user_id,book_id,earned_at,prompt,image_path,image_status,fallback_svg")  # ✅ 추가
            .eq("user_id", user_id)
            .order("earned_at", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
    )

    if not k_rows:
        return KeyringListOut(items=[])

    book_ids = list({r["book_id"] for r in k_rows if r.get("book_id")})
    b_rows = (
        sb.table("books")
        .select("id,title,thumbnail_url")
        .in_("id", book_ids)
        .execute()
        .data
        or []
    )
    book_map = {b["id"]: b for b in b_rows}

    items = []
    for r in k_rows:
        b = book_map.get(r["book_id"], {})
        # ✅ image_url 생성
        image_url = None
        if r.get("image_path"):
            image_url = signed_keyring_url(sb, r["image_path"])
        items.append(
            KeyringOut(
                id=r["id"],
                userId=r["user_id"],
                bookId=r["book_id"],
                earnedAt=r.get("earned_at"),
                bookTitle=b.get("title"),
                bookThumbnailUrl=b.get("thumbnail_url"),
                prompt=r.get("prompt"),
                # ✅ 추가
                imagePath=r.get("image_path"),
                imageUrl=image_url,
                imageStatus=r.get("image_status"),
                fallbackSvg=r.get("fallback_svg"),
            )
        )

    return KeyringListOut(items=items)

@router.get("/{book_id}/prompt", response_model=KeyringPromptOut)
def get_keyring_prompt(
    book_id: str,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """
    FE: "키링 생성" 버튼 누르면 호출 → 프롬프트 미리보기/복사
    - keyrings.prompt 컬럼이 있으면 그걸 우선 사용
    - 없거나 null이면 books 기반으로 즉시 생성
    """
    user_id = auth_ctx["user_id"]

    k = (
        sb.table("keyrings")
        .select("id,book_id,prompt")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .limit(1)
        .execute()
        .data
    )
    if not k:
        raise HTTPException(status_code=404, detail="Keyring not found for this book")

    prompt = k[0].get("prompt")
    if prompt:
        return KeyringPromptOut(bookId=book_id, prompt=prompt)

    # prompt가 없다면 books로 생성
    b = sb.table("books").select("*").eq("id", book_id).limit(1).execute().data
    if not b:
        raise HTTPException(status_code=404, detail="Book not found")

    # ✅ FIX: cover_features 추출 후 build_keyring_prompt에 전달
    dominant_hex, motif = extract_cover_features(b[0])

    p = sb.table("user_profiles").select("nickname").eq("user_id", user_id).limit(1).execute().data
    nickname = (p[0].get("nickname") if p else None)

    prompt = build_keyring_prompt(
        book=b[0],
        dominant_hex=dominant_hex,
        motif=motif,
        user_nickname=nickname,
    )
    return KeyringPromptOut(bookId=book_id, prompt=prompt)