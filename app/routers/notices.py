from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import Optional

from app.deps.auth import get_auth_context, get_db_client
from app.schemas.settings import NoticeOut, NoticeListOut

router = APIRouter(prefix="/notices", tags=["notices"])


@router.get("", response_model=NoticeListOut)
def list_notices(
    category: Optional[str] = None,
    limit: int = 20,
    sb: Client = Depends(get_db_client),
):
    """공지사항 목록 (고정 공지 상단 → 최신순)"""
    q = sb.table("notices").select("*")
    if category:
        q = q.eq("category", category)

    rows = (
        q.order("is_pinned", desc=True)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
    ) or []

    items = [
        NoticeOut(
            id=str(r["id"]),
            title=r["title"],
            content=r["content"],
            category=r.get("category"),
            isPinned=r.get("is_pinned", False),
            createdAt=r["created_at"],
        )
        for r in rows
    ]
    return NoticeListOut(items=items)


@router.get("/{notice_id}", response_model=NoticeOut)
def get_notice(
    notice_id: str,
    sb: Client = Depends(get_db_client),
):
    """공지사항 상세"""
    rows = sb.table("notices").select("*").eq("id", notice_id).limit(1).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="공지사항이 없습니다")

    r = rows[0]
    return NoticeOut(
        id=str(r["id"]),
        title=r["title"],
        content=r["content"],
        category=r.get("category"),
        isPinned=r.get("is_pinned", False),
        createdAt=r["created_at"],
    )