from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional

from app.deps.auth import get_auth_context, get_db_client
from app.schemas.reviews import ReviewCreateIn, ReviewListOut, ReviewOut

router = APIRouter(prefix="/reviews", tags=["reviews"])


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def _build_author(book: dict) -> str:
    authors = book.get("authors") or []
    if isinstance(authors, list):
        return ", ".join(str(a) for a in authors if a)
    return str(authors)


def _enrich_reviews(sb: Client, rows: list) -> list[ReviewOut]:
    """리뷰 rows에 책/유저 정보 붙여서 ReviewOut 리스트 반환"""
    if not rows:
        return []

    book_ids = list({r["book_id"] for r in rows if r.get("book_id")})
    b_rows = (
        sb.table("books")
        .select("id,title,thumbnail_url,authors")
        .in_("id", book_ids)
        .execute()
        .data or []
    )
    book_map = {b["id"]: b for b in b_rows}

    user_ids = list({r["user_id"] for r in rows})
    p_rows = (
        sb.table("user_profiles")
        .select("user_id,nickname,avatar_url")
        .in_("user_id", user_ids)
        .execute()
        .data or []
    )
    profile_map = {p["user_id"]: p for p in p_rows}

    items = []
    for r in rows:
        b = book_map.get(r["book_id"], {})
        p = profile_map.get(r["user_id"], {})
        items.append(ReviewOut(
            id=r["id"],
            userId=r["user_id"],
            userNickname=p.get("nickname"),
            userAvatarUrl=p.get("avatar_url"),
            bookId=r["book_id"],
            bookTitle=b.get("title"),
            bookThumbnailUrl=b.get("thumbnail_url"),
            bookAuthor=_build_author(b),
            readingStartDate=r.get("reading_start_date"),
            readingEndDate=r.get("reading_end_date"),
            content=r["content"],
            isPublic=bool(r.get("is_public", True)),
            createdAt=r.get("created_at"),
        ))
    return items


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(
    body: ReviewCreateIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]

    # 책 존재 확인
    b = sb.table("books").select("id").eq("id", body.bookId).limit(1).execute().data
    if not b:
        raise HTTPException(status_code=404, detail="Book not found")

    inserted = sb.table("reviews").insert({
        "user_id": user_id,
        "book_id": body.bookId,
        "reading_start_date": body.readingStartDate,
        "reading_end_date": body.readingEndDate,
        "content": body.content,
        "is_public": body.isPublic,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }).execute().data

    row = inserted[0]
    enriched = _enrich_reviews(sb, [row])
    return enriched[0]


@router.get("/my", response_model=ReviewListOut)
def list_my_reviews(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: Optional[str] = Query(default=None),
):
    """내가 쓴 리뷰 목록 (내서재 → 내 리뷰)"""
    user_id = auth_ctx["user_id"]

    q = (
        sb.table("reviews")
        .select("id,user_id,book_id,content,is_public,reading_start_date,reading_end_date,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit + 1)
    )
    if cursor:
        q = q.lt("created_at", cursor)

    rows = q.execute().data or []
    has_more = len(rows) > limit
    rows = rows[:limit]

    items = _enrich_reviews(sb, rows)
    next_cursor = rows[-1]["created_at"] if has_more and rows else None
    return ReviewListOut(items=items, hasMore=has_more, nextCursor=next_cursor)


@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: str,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """리뷰 삭제 (본인만 가능)"""
    user_id = auth_ctx["user_id"]

    rows = sb.table("reviews").select("id,user_id").eq("id", review_id).limit(1).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Review not found")
    if rows[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    sb.table("reviews").delete().eq("id", review_id).execute()