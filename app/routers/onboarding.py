from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.deps.auth import get_auth_context, get_db_client
from app.schemas.onboarding import (
    OnboardingUserTypeIn,
    OnboardingReadingProfileIn,
    CommuteProfileIn,
    ReadingTestStartOut,
    ReadingTestFinishIn,
    ReadingTestFinishOut,
    SkipSpeedTestOut,
)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def ensure_not_onboarded(sb: Client, user_id: str):
    u = sb.table("users").select("is_onboarded").eq("id", user_id).limit(1).execute().data
    if u and u[0].get("is_onboarded"):
        raise HTTPException(status_code=409, detail="User already onboarded")

def set_step(sb: Client, user_id: str, step: str):
    sb.table("users").update({"onboarding_step": step}).eq("id", user_id).execute()

@router.post("/user-type")
def set_user_type(
    body: OnboardingUserTypeIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]
    ensure_not_onboarded(sb, user_id)

    sb.table("users").update({"user_type": body.userType}).eq("id", user_id).execute()
    set_step(sb, user_id, "type_selected")
    return {"ok": True, "userType": body.userType}

@router.post("/reading-profile")
def set_reading_profile(
    body: OnboardingReadingProfileIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    print("reading-profile called", auth_ctx["user_id"], body.model_dump())
    user_id = auth_ctx["user_id"]
    ensure_not_onboarded(sb, user_id)

    sb.table("user_profiles").upsert({
        "user_id": user_id,
        "nickname": body.nickname,
        "preferred_genres": body.preferredGenres,
        "self_speed_level": body.readingSpeed,
        "weekly_read_count": body.weeklyReadCount,
        "updated_at": now_iso(),
    }, on_conflict="user_id").execute()

    set_step(sb, user_id, "reading_profile_done")
    return {"ok": True}

@router.post("/commute-profile")
def set_commute_profile(
    body: CommuteProfileIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]
    ensure_not_onboarded(sb, user_id)

    u = sb.table("users").select("user_type").eq("id", user_id).limit(1).execute().data
    user_type = u[0]["user_type"] if u else None
    if user_type != "worker_student":
        raise HTTPException(status_code=400, detail="Commute profile is only for worker_student users")

    sb.table("commute_profiles").update({"is_default": False}).eq("user_id", user_id).eq("is_default", True).execute()

    sb.table("commute_profiles").insert({
        "user_id": user_id,
        "name": body.name,
        "is_default": True,
        "origin_name": body.originName,
        "destination_name": body.destinationName,
        "commute_time": f"{body.commuteHour:02d}:{body.commuteMinute:02d}:00",
        "commute_days": body.commuteDays,
        "depart_time": f"{body.departHour:02d}:{body.departMinute:02d}:00",
        "return_time": f"{body.returnHour:02d}:{body.returnMinute:02d}:00",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }).execute()

    set_step(sb, user_id, "commute_profile_done")
    return {"ok": True}

@router.post("/reading-test/start", response_model=ReadingTestStartOut)
def start_speed_test(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]
    ensure_not_onboarded(sb, user_id)

    texts = sb.table("reading_speed_texts").select("*").order("created_at", desc=True).limit(1).execute().data
    if not texts:
        raise HTTPException(status_code=500, detail="No reading_speed_texts found")
    t = texts[0]

    inserted = sb.table("reading_speed_tests").insert({
        "user_id": user_id,
        "text_id": t["id"],
        "elapsed_seconds": 0,
        "syllable_count": t.get("syllable_count"),
        "ppm": 0,
        "user_choice": None,
        "is_correct": None,
        "source": "onboarding",
    }).execute().data

    return ReadingTestStartOut(
        testId=inserted[0]["id"],
        textId=t["id"],
        body=t["body"],
        syllableCount=int(t.get("syllable_count") or 360),
        question=t["question"],
        choices=t["choices"],
    )

@router.post("/reading-test/finish", response_model=ReadingTestFinishOut)
def finish_speed_test(
    body: ReadingTestFinishIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]
    ensure_not_onboarded(sb, user_id)

    test_rows = sb.table("reading_speed_tests").select("*").eq("id", body.testId).limit(1).execute().data
    if not test_rows:
        raise HTTPException(status_code=404, detail="Test not found")
    test = test_rows[0]
    if test["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    text_rows = sb.table("reading_speed_texts").select("*").eq("id", test["text_id"]).limit(1).execute().data
    if not text_rows:
        raise HTTPException(status_code=500, detail="Text not found for this test")
    t = text_rows[0]

    syllables = int(t.get("syllable_count") or 360)
    ppm = (syllables / body.elapsedSeconds) * 60.0
    is_correct = (body.userChoice == int(t["correct_choice"]))

    sb.table("reading_speed_tests").update({
        "elapsed_seconds": body.elapsedSeconds,
        "ppm": ppm,
        "user_choice": body.userChoice,
        "is_correct": is_correct,
    }).eq("id", body.testId).execute()

    prof = sb.table("user_profiles").select("initial_ppm").eq("user_id", user_id).limit(1).execute().data
    initial_exists = bool(prof and prof[0].get("initial_ppm") is not None)

    update_profile = {
        "user_id": user_id,
        "current_ppm": ppm,
        "updated_at": now_iso(),
    }
    if not initial_exists:
        update_profile["initial_ppm"] = ppm
        update_profile["initial_ppm_set_at"] = now_iso()

    sb.table("user_profiles").upsert(update_profile, on_conflict="user_id").execute()

    sb.table("users").update({
        "is_onboarded": True,
        "onboarded_at": now_iso(),
        "onboarding_step": "done",
    }).eq("id", user_id).execute()

    return ReadingTestFinishOut(
        elapsedSeconds=body.elapsedSeconds,
        ppm=ppm,
        isCorrect=is_correct,
        isOnboarded=True,
    )

@router.post("/reading-test/skip", response_model=SkipSpeedTestOut)
def skip_speed_test(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]
    ensure_not_onboarded(sb, user_id)

    sb.table("users").update({
        "is_onboarded": True,
        "onboarded_at": now_iso(),
        "onboarding_step": "done",
    }).eq("id", user_id).execute()

    return SkipSpeedTestOut(isOnboarded=True)