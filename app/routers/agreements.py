from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime, timezone
from typing import List, Optional

from app.deps.auth import get_auth_context, get_db_client
from app.schemas.settings import (
    AgreementIn, AgreementOut,
    MarketingConsentUpdateIn,
    PolicyDocumentOut,
)

router = APIRouter(prefix="/agreements", tags=["agreements"])


def now_iso():
    return datetime.now(timezone.utc).isoformat()


@router.get("", response_model=AgreementOut)
def get_agreement(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """현재 사용자의 최신 약관 동의 상태 조회"""
    user_id = auth_ctx["user_id"]
    rows = (
        sb.table("user_agreements")
        .select("*")
        .eq("user_id", user_id)
        .order("agreed_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        return AgreementOut(userId=user_id, marketingConsent=False)

    r = rows[0]
    return AgreementOut(
        userId=user_id,
        termsVersion=r.get("terms_version"),
        privacyVersion=r.get("privacy_version"),
        locationTermsVersion=r.get("location_terms_version"),
        marketingConsent=r.get("marketing_consent", False),
        agreedAt=r.get("agreed_at"),
        device=r.get("device"),
        appVersion=r.get("app_version"),
    )


@router.post("", response_model=AgreementOut)
def create_agreement(
    body: AgreementIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """
    약관 동의 이력 저장 (append-only, 이력 보존)
    - 최초 온보딩, 약관 개정 시마다 새 row insert
    - 필수: 이용약관 / 개인정보처리방침 / 위치정보
    - 선택: 마케팅 수신 동의
    """
    user_id = auth_ctx["user_id"]
    agreed_at = now_iso()

    sb.table("user_agreements").insert({
        "user_id": user_id,
        "terms_version": body.termsVersion,
        "privacy_version": body.privacyVersion,
        "location_terms_version": body.locationTermsVersion,
        "marketing_consent": body.marketingConsent,
        "device": body.device,
        "app_version": body.appVersion,
        "agreed_at": agreed_at,
    }).execute()

    return AgreementOut(
        userId=user_id,
        termsVersion=body.termsVersion,
        privacyVersion=body.privacyVersion,
        locationTermsVersion=body.locationTermsVersion,
        marketingConsent=body.marketingConsent,
        agreedAt=agreed_at,
        device=body.device,
        appVersion=body.appVersion,
    )


@router.patch("/marketing", response_model=AgreementOut)
def update_marketing_consent(
    body: MarketingConsentUpdateIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """설정 페이지에서 마케팅 수신 동의만 토글"""
    user_id = auth_ctx["user_id"]
    agreed_at = now_iso()

    rows = (
        sb.table("user_agreements")
        .select("*")
        .eq("user_id", user_id)
        .order("agreed_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="약관 동의 이력이 없습니다")

    latest = rows[0]

    # 이력 보존을 위해 새 row insert (기존 값 유지 + marketing만 변경)
    sb.table("user_agreements").insert({
        "user_id": user_id,
        "terms_version": latest.get("terms_version"),
        "privacy_version": latest.get("privacy_version"),
        "location_terms_version": latest.get("location_terms_version"),
        "marketing_consent": body.marketingConsent,
        "device": latest.get("device"),
        "app_version": latest.get("app_version"),
        "agreed_at": agreed_at,
    }).execute()

    return AgreementOut(
        userId=user_id,
        termsVersion=latest.get("terms_version"),
        privacyVersion=latest.get("privacy_version"),
        locationTermsVersion=latest.get("location_terms_version"),
        marketingConsent=body.marketingConsent,
        agreedAt=agreed_at,
        device=latest.get("device"),
        appVersion=latest.get("app_version"),
    )


@router.get("/policies", response_model=List[PolicyDocumentOut])
def get_policies(
    type: Optional[str] = None,
    sb: Client = Depends(get_db_client),
):
    """
    정책 문서 조회 (type별 최신 버전만)
    - type: terms / privacy / location / marketing
    - 미지정 시 전체
    """
    q = sb.table("policy_documents").select("*")
    if type:
        q = q.eq("type", type)
    rows = q.order("effective_date", desc=True).execute().data or []

    latest_by_type = {}
    for r in rows:
        t = r["type"]
        if t not in latest_by_type:
            latest_by_type[t] = r

    return [
        PolicyDocumentOut(
            type=r["type"],
            version=r["version"],
            title=r["title"],
            contentUrl=r.get("content_url"),
            content=r.get("content"),
            effectiveDate=r["effective_date"],
        )
        for r in latest_by_type.values()
    ]