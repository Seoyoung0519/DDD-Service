from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime, timezone
from typing import List, Optional

from app.deps.auth import get_auth_context, get_db_client
from app.db.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/banners", tags=["banners"])


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── 메인 페이지: 현재 활성 배너 조회 ──────────────────
@router.get("")
def get_active_banners(
        category: Optional[str] = None,
        limit: int = 10,
        sb: Client = Depends(get_db_client),
):
    """
    현재 노출 중인 배너 목록 조회
    - 활성화되고 관리자 승인된 배너만
    - 기간 내에 있는 배너만
    - category 필터링 가능 (event, fair, challenge, recommend_book)
    """
    current_time = now_iso()

    q = (
        sb.table("banners")
        .select("*")
        .eq("is_active", True)
        .eq("is_approved", True)
        .lte("start_at", current_time)
        .gt("end_at", current_time)
    )

    if category:
        q = q.eq("category", category)

    rows = (
               q.order("order_index", desc=False)
               .order("created_at", desc=True)
               .limit(limit)
               .execute()
               .data
           ) or []

    return {
        "items": rows,
        "count": len(rows),
    }


# ── 관리자: 승인 대기 중인 배너 조회 ──────────────────
@router.get("/admin/pending")
def get_pending_banners(
        auth_ctx: dict = Depends(get_auth_context),
        sb: Client = Depends(get_db_client),
):
    """관리자 전용: 승인 대기 중인 배너 목록"""
    # 실제 구현에서는 admin 권한 검증 필요
    rows = (
               sb.table("banners")
               .select("*")
               .eq("is_approved", False)
               .order("created_at", desc=True)
               .execute()
               .data
           ) or []

    return {
        "items": rows,
        "count": len(rows),
    }


# ── 관리자: 배너 승인 ──────────────────────────────
@router.patch("/admin/{banner_id}/approve")
def approve_banner(
        banner_id: str,
        auth_ctx: dict = Depends(get_auth_context),
        sb: Client = Depends(get_db_client),
):
    """관리자 전용: 배너 승인 & 활성화"""
    admin = get_supabase_admin_client()

    try:
        admin.table("banners").update({
            "is_approved": True,
            "is_active": True,
            "updated_at": now_iso(),
        }).eq("id", banner_id).execute()

        return {"ok": True, "message": "배너 승인됨"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 관리자: 배너 거절 ──────────────────────────────
@router.patch("/admin/{banner_id}/reject")
def reject_banner(
        banner_id: str,
        auth_ctx: dict = Depends(get_auth_context),
        sb: Client = Depends(get_db_client),
):
    """관리자 전용: 배너 거절 (삭제)"""
    admin = get_supabase_admin_client()

    try:
        admin.table("banners").delete().eq("id", banner_id).execute()
        return {"ok": True, "message": "배너 거절됨"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 관리자: 배너 수동 생성 ──────────────────────────
@router.post("/admin")
def create_banner(
        body: dict,
        auth_ctx: dict = Depends(get_auth_context),
        sb: Client = Depends(get_db_client),
):
    """관리자 전용: 배너 수동 생성

    Request Body:
    {
        "title": "배너 제목",
        "description": "설명",
        "image_url": "https://...",
        "landing_url": "https://...",
        "category": "event|fair|challenge|recommend_book",
        "source": "manual",
        "start_at": "2023-06-01",
        "end_at": "2023-06-30",
        "location": "장소",
    }
    """
    admin = get_supabase_admin_client()

    try:
        insert_data = {
            "title": body.get("title"),
            "description": body.get("description", ""),
            "image_url": body.get("image_url"),
            "landing_url": body.get("landing_url"),
            "category": body.get("category"),
            "source": body.get("source", "manual"),
            "start_at": body.get("start_at"),
            "end_at": body.get("end_at"),
            "location": body.get("location"),
            "is_active": True,
            "is_approved": True,
        }

        result = admin.table("banners").insert(insert_data).execute()
        return {"ok": True, "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 관리자: 배너 수정 ──────────────────────────────
@router.put("/admin/{banner_id}")
def update_banner(
        banner_id: str,
        body: dict,
        auth_ctx: dict = Depends(get_auth_context),
        sb: Client = Depends(get_db_client),
):
    """관리자 전용: 배너 수정"""
    admin = get_supabase_admin_client()

    try:
        update_data = {
            "updated_at": now_iso(),
        }

        # 변경된 필드만 업데이트
        if "title" in body:
            update_data["title"] = body["title"]
        if "description" in body:
            update_data["description"] = body["description"]
        if "image_url" in body:
            update_data["image_url"] = body["image_url"]
        if "landing_url" in body:
            update_data["landing_url"] = body["landing_url"]
        if "start_at" in body:
            update_data["start_at"] = body["start_at"]
        if "end_at" in body:
            update_data["end_at"] = body["end_at"]
        if "location" in body:
            update_data["location"] = body["location"]
        if "is_active" in body:
            update_data["is_active"] = body["is_active"]
        if "order_index" in body:
            update_data["order_index"] = body["order_index"]

        admin.table("banners").update(update_data).eq("id", banner_id).execute()

        return {"ok": True, "message": "배너 수정됨"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 관리자: 배너 삭제 ──────────────────────────────
@router.delete("/admin/{banner_id}")
def delete_banner(
        banner_id: str,
        auth_ctx: dict = Depends(get_auth_context),
        sb: Client = Depends(get_db_client),
):
    """관리자 전용: 배너 삭제"""
    admin = get_supabase_admin_client()

    try:
        admin.table("banners").delete().eq("id", banner_id).execute()
        return {"ok": True, "message": "배너 삭제됨"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 관리자: 크롤링 로그 조회 ──────────────────────
@router.get("/admin/crawl-logs")
def get_crawl_logs(
        auth_ctx: dict = Depends(get_auth_context),
        sb: Client = Depends(get_db_client),
        limit: int = 50,
):
    """관리자 전용: 최근 크롤링 로그"""
    rows = (
               sb.table("crawl_logs")
               .select("*")
               .order("crawled_at", desc=True)
               .limit(limit)
               .execute()
               .data
           ) or []

    return {
        "items": rows,
        "count": len(rows),
    }
