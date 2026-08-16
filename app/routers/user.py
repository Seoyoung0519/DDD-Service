from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.deps.auth import get_auth_context, get_db_client
from app.schemas.user import UserProfileOut, UserProfileUpdateIn, UserProfileUpdateOut
from datetime import datetime, timezone

router = APIRouter(prefix="/user", tags=["user"])

def now_iso():
    return datetime.now(timezone.utc).isoformat()

VALID_AVATAR_IDS = {
    "avatar_01", "avatar_02", "avatar_03", "avatar_04",
    "avatar_05", "avatar_06", "avatar_07", "avatar_08",
    # 디자인 확정 후 여기에 추가
}

@router.get("/profile", response_model=UserProfileOut)
def get_user_profile(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]
    email = auth_ctx.get("email")

    user_data = {
        "id": user_id,
        "status": "active",
    }

    if email:
        user_data["email"] = email

    sb.table("users").upsert(
        user_data,
        on_conflict="id"
    ).execute()

    u_rows = sb.table("users").select("is_onboarded,onboarded_at,user_type,onboarding_step").eq("id", user_id).limit(1).execute().data
    u = u_rows[0] if u_rows else {"is_onboarded": False, "onboarded_at": None, "user_type": None, "onboarding_step": "start"}

    p_rows = sb.table("user_profiles").select("*").eq("user_id", user_id).limit(1).execute().data
    p = p_rows[0] if p_rows else None

    return UserProfileOut(
        userId=user_id,
        email=email,

        isOnboarded=bool(u.get("is_onboarded")),
        onboardedAt=u.get("onboarded_at"),

        userType=u.get("user_type"),
        onboardingStep=u.get("onboarding_step"),

        nickname=p.get("nickname") if p else None,
        preferredGenres=p.get("preferred_genres") if p else None,
        readingSpeed=p.get("self_speed_level") if p else None,
        weeklyReadCount=p.get("weekly_read_count") if p else None,

        initialPPM=float(p["initial_ppm"]) if p and p.get("initial_ppm") is not None else None,
        currentPPM=float(p["current_ppm"]) if p and p.get("current_ppm") is not None else None,
        initialPPMSetAt=p.get("initial_ppm_set_at") if p else None,

        # ✅ 추가
        avatarId=p.get("avatar_id") if p else None,
        avatarUrl=p.get("avatar_url") if p else None,
    )


@router.patch("/profile", response_model=UserProfileUpdateOut)
def update_user_profile(
    body: UserProfileUpdateIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """
    닉네임(사용자 아이디) 및 아바타 수정
    - nickname: 1~20자, 중복 불가
    - avatarId: 서버에서 허용된 ID 목록 검증
    """
    user_id = auth_ctx["user_id"]

    # 변경 사항이 하나도 없으면 early return
    if body.nickname is None and body.avatarId is None:
        raise HTTPException(status_code=400, detail="Nothing to update")

    update_payload: dict = {"updated_at": now_iso()}

    # ── 닉네임 검증 ──────────────────────────────────────
    if body.nickname is not None:
        nickname = body.nickname.strip()
        if len(nickname) < 1 or len(nickname) > 20:
            raise HTTPException(status_code=422, detail="닉네임은 1~20자여야 합니다")

        # 중복 확인 (본인 제외)
        dup = (
            sb.table("user_profiles")
            .select("user_id")
            .eq("nickname", nickname)
            .neq("user_id", user_id)
            .limit(1)
            .execute()
            .data
        )
        if dup:
            raise HTTPException(status_code=409, detail="이미 사용 중인 닉네임입니다")

        update_payload["nickname"] = nickname

    # ── 아바타 검증 ──────────────────────────────────────
    if body.avatarId is not None:
        if body.avatarId not in VALID_AVATAR_IDS:
            raise HTTPException(status_code=422, detail=f"유효하지 않은 아바타 ID입니다: {body.avatarId}")
        update_payload["avatar_id"] = body.avatarId

    # ── upsert ───────────────────────────────────────────
    update_payload["user_id"] = user_id
    sb.table("user_profiles").upsert(update_payload, on_conflict="user_id").execute()

    # 최신 값 조회 후 반환
    p_rows = sb.table("user_profiles").select("nickname,avatar_id").eq("user_id", user_id).limit(1).execute().data
    p = p_rows[0] if p_rows else {}

    return UserProfileUpdateOut(
        ok=True,
        nickname=p.get("nickname"),
        avatarId=p.get("avatar_id"),
    )


@router.get("/profile/check-nickname", response_model=dict)
def check_nickname_availability(
    nickname: str,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """
    닉네임 중복 확인 (실시간 검증용)
    Response: {"available": true/false}
    """
    user_id = auth_ctx["user_id"]
    nickname = nickname.strip()

    if len(nickname) < 1 or len(nickname) > 20:
        return {"available": False, "reason": "length"}

    dup = (
        sb.table("user_profiles")
        .select("user_id")
        .eq("nickname", nickname)
        .neq("user_id", user_id)
        .limit(1)
        .execute()
        .data
    )
    return {"available": len(dup) == 0}