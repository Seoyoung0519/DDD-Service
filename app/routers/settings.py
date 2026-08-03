from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime, timezone

from app.deps.auth import get_auth_context, get_db_client
from app.db.supabase_client import get_supabase_admin_client
from app.schemas.settings import (
    AccountDeleteIn, AccountDeleteOut,
    AppVersionOut,
)

router = APIRouter(prefix="/settings", tags=["settings"])


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ─────────────────────────────────────────────
# 계정 탈퇴 (Apple/Google 심사 필수)
# ─────────────────────────────────────────────
@router.delete("/account", response_model=AccountDeleteOut)
def delete_account(
        body: AccountDeleteIn,
        auth_ctx: dict = Depends(get_auth_context),
):
    """
    계정 탈퇴 처리
    1. 확인 문구 검증 ("탈퇴")
    2. 탈퇴 로그 저장 (통계용, PII 제거)
    3. 사용자 데이터 삭제 (모든 관련 테이블)
    4. users는 soft delete (status='deleted', email null)
    5. Supabase Auth 계정 삭제

    삭제 테이블 순서:
    - 직접 참조 테이블: proofs, read_proofs, reviews, user_books 등
    - 프로필/설정: user_profiles, commute_profiles, user_devices, keyring, notifications
    - 세션/기록: reading_sessions, reading_speed_tests, reading_tests
    """
    user_id = auth_ctx["user_id"]

    if body.confirmText.strip() != "탈퇴":
        raise HTTPException(status_code=400, detail="확인 문구가 일치하지 않습니다")

    deleted_at = now_iso()
    admin = get_supabase_admin_client()

    # 1) 탈퇴 로그 (통계·감사용)
    try:
        admin.table("account_deletion_logs").insert({
            "user_id": user_id,
            "reason": body.reason,
            "deleted_at": deleted_at,
        }).execute()
    except Exception as e:
        print(f"[DELETE] account_deletion_logs 실패: {e}")

    # 2) 개인 식별 데이터 삭제
    # 삭제 순서: 자식 테이블부터 (외래키 제약 상관 없으나 논리적 순서)
    tables_to_delete = [
        # 증명 / 기록
        "read_proofs",
        "proofs",
        "reading_tests",
        "reading_speed_tests",
        "reading_sessions",

        # 책/리뷰
        "reviews",
        "user_books",

        # 프로필/설정
        "user_profiles",
        "commute_profiles",
        "user_devices",
        "notifications",
        "keyring",
    ]

    for table in tables_to_delete:
        try:
            admin.table(table).delete().eq("user_id", user_id).execute()
            print(f"[DELETE] {table} 완료")
        except Exception as e:
            print(f"[DELETE] {table} 실패: {e}")

    # 3) users는 통계용으로 남기되 PII 제거
    try:
        admin.table("users").update({
            "status": "deleted",
            "email": None,
            "deleted_at": deleted_at,
        }).eq("id", user_id).execute()
        print(f"[DELETE] users soft delete 완료")
    except Exception as e:
        print(f"[DELETE] users update 실패: {e}")

    # 4) Supabase Auth 계정 삭제
    try:
        admin.auth.admin.delete_user(user_id)
        print(f"[DELETE] auth 삭제 완료")
    except Exception as e:
        print(f"[DELETE] auth 삭제 실패: {e}")

    return AccountDeleteOut(ok=True, deletedAt=deleted_at)


# ─────────────────────────────────────────────
# 앱 버전 정보
# ─────────────────────────────────────────────
@router.get("/version", response_model=AppVersionOut)
def get_app_version(
        platform: str = "android",
        sb: Client = Depends(get_db_client),
):
    """프론트가 현재 버전과 비교해서 업데이트 안내에 사용"""
    rows = (
        sb.table("app_versions")
        .select("*")
        .eq("platform", platform)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="버전 정보가 없습니다")

    r = rows[0]
    return AppVersionOut(
        platform=platform,
        latestVersion=r["latest_version"],
        minimumVersion=r["minimum_version"],
        forceUpdate=r.get("force_update", False),
        updateUrl=r.get("update_url"),
    )