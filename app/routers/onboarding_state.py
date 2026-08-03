from fastapi import APIRouter, Depends
from supabase import Client
from typing import Optional
from app.deps.auth import get_auth_context, get_db_client
from app.schemas.onboarding_state import OnboardingStateOut

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

def _compute_next(user_type: Optional[str], step: str, is_onboarded: bool):
    # ✅ FIX: is_onboarded 또는 step="done"이면 바로 홈으로
    if is_onboarded or step == "done":
        return "enter_home", []

    if not user_type:
        return "select_user_type", ["user_type"]

    if step in (None, "start", "type_selected"):
        return "fill_reading_profile", ["reading_profile"]

    if step == "reading_profile_done":
        if user_type == "worker_student":
            return "fill_commute_profile", ["commute_profile"]
        return "do_speed_test", ["speed_test"]

    if step == "commute_profile_done":
        return "do_speed_test", ["speed_test"]

    # ✅ FIX: speed_test_done은 현재 코드에서 저장되지 않지만
    #         혹시 미래에 저장될 경우를 대비해 유지
    if step == "speed_test_done":
        return "enter_home", []

    # 알 수 없는 step → 처음부터
    return "select_user_type", ["user_type"]

@router.get("/state", response_model=OnboardingStateOut)
def get_onboarding_state(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]

    u_rows = sb.table("users").select("user_type,onboarding_step,is_onboarded").eq("id", user_id).limit(1).execute().data
    u = u_rows[0] if u_rows else {"user_type": None, "onboarding_step": "start", "is_onboarded": False}

    user_type = u.get("user_type")
    step = u.get("onboarding_step") or "start"
    is_onboarded = bool(u.get("is_onboarded"))

    next_action, required = _compute_next(user_type, step, is_onboarded)

    return OnboardingStateOut(
        userId=user_id,
        userType=user_type,
        step=step,
        isOnboarded=is_onboarded,
        nextAction=next_action,
        required=required,
    )