from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from supabase import Client
from typing import Optional

from app.deps.auth import get_auth_context, get_db_client
from app.services.keyring_prompt import build_keyring_prompt
from app.services.cover_features import extract_cover_features

router = APIRouter(prefix="/user-books", tags=["user_books"])


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def resolve_book_by_identifier(
    sb: Client,
    *,
    book_id: Optional[str] = None,
    aladin_item_id: Optional[str] = None,
) -> dict:
    """
    book_id 또는 aladin_item_id로 books row를 찾는다.
    반환값 예:
    {
        "id": "...",
        "aladin_item_id": "..."
    }
    """
    if book_id:
        rows = (
            sb.table("books")
            .select("id,aladin_item_id")
            .eq("id", book_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Book not found")
        return rows[0]

    if aladin_item_id:
        rows = (
            sb.table("books")
            .select("id,aladin_item_id")
            .eq("aladin_item_id", aladin_item_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Book not found by aladinItemId")
        return rows[0]

    raise HTTPException(status_code=400, detail="bookId 또는 aladinItemId 중 하나는 필수입니다.")


# ── 스키마 ─────────────────────────────────────────────────────────────────────

class WishAddIn(BaseModel):
    bookId: Optional[str] = None
    aladinItemId: Optional[str] = None

    @model_validator(mode="after")
    def validate_one_of_ids(self):
        if not self.bookId and not self.aladinItemId:
            raise ValueError("bookId 또는 aladinItemId 중 하나는 필수입니다.")
        return self


class WishAddOut(BaseModel):
    ok: bool
    userBookId: str
    bookId: str
    aladinItemId: Optional[str] = None
    status: str


class UpdateProgressIn(BaseModel):
    currentPage: int = Field(ge=0)
    status: Optional[str] = None  # 'reading' | 'completed' | ...


class UpdateProgressOut(BaseModel):
    ok: bool
    userBookId: str
    isCompleted: bool
    keyringCreated: bool


# ── 찜하기 추가 ────────────────────────────────────────────────────────────────

@router.post("/wish", response_model=WishAddOut, status_code=201)
def add_to_wishlist(
    body: WishAddIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """
    책을 찜 목록에 추가한다.
    - bookId 또는 aladinItemId로 요청 가능
    - 내부 저장은 항상 user_books.book_id = books.id
    - 이미 user_books에 어떤 status로든 존재하면 409 반환
    """
    user_id = auth_ctx["user_id"]

    book = resolve_book_by_identifier(
        sb,
        book_id=body.bookId,
        aladin_item_id=body.aladinItemId,
    )
    book_id = book["id"]
    aladin_item_id = book.get("aladin_item_id")

    existing = (
        sb.table("user_books")
        .select("id,status")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .limit(1)
        .execute()
        .data
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Book already in shelf with status '{existing[0]['status']}'"
        )

    inserted = (
        sb.table("user_books")
        .insert({
            "user_id": user_id,
            "book_id": book_id,
            "status": "wish",
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })
        .execute()
        .data
    )

    row = inserted[0]
    return WishAddOut(
        ok=True,
        userBookId=row["id"],
        bookId=row["book_id"],
        aladinItemId=aladin_item_id,
        status=row["status"],
    )


# ── 진행상황 업데이트 ──────────────────────────────────────────────────────────

@router.patch("/{user_book_id}/progress", response_model=UpdateProgressOut)
def update_user_book_progress(
    user_book_id: str,
    body: UpdateProgressIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """
    - current_page 업데이트
    - 완독 조건이면 status='completed' 처리
    - keyrings (user_id, book_id) 1개 자동 생성 (+ prompt 저장)
    """
    user_id = auth_ctx["user_id"]

    rows = (
        sb.table("user_books")
        .select("id,user_id,book_id,status,current_page,end_page")
        .eq("id", user_book_id)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="user_book not found")

    ub = rows[0]
    if ub["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    end_page = ub.get("end_page")
    new_current = body.currentPage

    upd = {"current_page": new_current, "updated_at": now_iso()}
    if body.status:
        upd["status"] = body.status

    page_based_completed = (
        end_page is not None
        and end_page > 0
        and new_current >= end_page
    )
    completed = body.status == "completed" or page_based_completed

    if completed:
        upd["status"] = "completed"
        upd["completed_at"] = now_iso()

    try:
        sb.table("user_books").update(upd).eq("id", user_book_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"user_books update failed: {e}")

    keyring_created = False
    if completed:
        k = (
            sb.table("keyrings")
            .select("id,prompt")
            .eq("user_id", user_id)
            .eq("book_id", ub["book_id"])
            .limit(1)
            .execute()
            .data
        )
        if not k:
            b = sb.table("books").select("*").eq("id", ub["book_id"]).limit(1).execute().data
            if not b:
                raise HTTPException(status_code=404, detail="Book not found for keyring prompt")

            dominant_hex, motif = extract_cover_features(b[0])

            p = sb.table("user_profiles").select("nickname").eq("user_id", user_id).limit(1).execute().data
            nickname = (p[0].get("nickname") if p else None)

            prompt = build_keyring_prompt(
                book=b[0],
                dominant_hex=dominant_hex,
                motif=motif,
                user_nickname=nickname,
            )

            try:
                sb.table("keyrings").insert({
                    "user_id": user_id,
                    "book_id": ub["book_id"],
                    "earned_at": now_iso(),
                    "prompt": prompt,
                }).execute()
                keyring_created = True
            except Exception:
                keyring_created = False

    return UpdateProgressOut(
        ok=True,
        userBookId=user_book_id,
        isCompleted=completed,
        keyringCreated=keyring_created,
    )