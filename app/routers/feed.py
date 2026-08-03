from fastapi import APIRouter, Depends, Query
from supabase import Client
from typing import Optional

from app.deps.auth import get_auth_context, get_db_client
from app.schemas.feed import FeedListOut, FeedItemOut

router = APIRouter(prefix="/feed", tags=["feed"])


def _build_author(book: dict) -> str:
    authors = book.get("authors") or []
    if isinstance(authors, list):
        return ", ".join(str(a) for a in authors if a)
    return str(authors)


@router.get("", response_model=FeedListOut)
def get_feed(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: Optional[str] = Query(default=None, description="pagination cursor (created_at ISO)"),
):
    """
    전체 공개 리뷰를 최신순으로 반환 (피드 타임라인)
    """
    q = (
        sb.table("reviews")
        .select("id,user_id,book_id,content,created_at")
        .eq("is_public", True)
        .order("created_at", desc=True)
        .limit(limit + 1)
    )
    if cursor:
        q = q.lt("created_at", cursor)

    rows = q.execute().data or []
    has_more = len(rows) > limit
    rows = rows[:limit]

    if not rows:
        return FeedListOut(items=[], hasMore=False)

    # 책 정보 일괄 조회
    book_ids = list({r["book_id"] for r in rows if r.get("book_id")})
    b_rows = (
        sb.table("books")
        .select("id,title,thumbnail_url,authors")
        .in_("id", book_ids)
        .execute()
        .data or []
    )
    book_map = {b["id"]: b for b in b_rows}

    # 유저 프로필 일괄 조회
    user_ids = list({r["user_id"] for r in rows if r.get("user_id")})
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
        items.append(FeedItemOut(
            id=r["id"],
            userId=r["user_id"],
            userNickname=p.get("nickname"),
            userAvatarUrl=p.get("avatar_url"),
            bookId=r["book_id"],
            bookTitle=b.get("title"),
            bookThumbnailUrl=b.get("thumbnail_url"),
            bookAuthor=_build_author(b),
            reviewId=r["id"],
            reviewContent=r["content"],
            createdAt=r.get("created_at"),
        ))

    next_cursor = rows[-1]["created_at"] if has_more and rows else None
    return FeedListOut(items=items, hasMore=has_more, nextCursor=next_cursor)