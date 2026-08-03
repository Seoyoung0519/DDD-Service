from pydantic import BaseModel
from typing import Optional, List


# ── 계정 탈퇴 ────────────────────────────────
class AccountDeleteIn(BaseModel):
    reason: Optional[str] = None
    confirmText: str  # "탈퇴" 문구 확인


class AccountDeleteOut(BaseModel):
    ok: bool
    deletedAt: str


# ── 약관 동의 ────────────────────────────────
class AgreementIn(BaseModel):
    termsVersion: str
    privacyVersion: str
    locationTermsVersion: str
    marketingConsent: bool = False
    device: Optional[str] = None       # "android" / "ios"
    appVersion: Optional[str] = None


class AgreementOut(BaseModel):
    userId: str
    termsVersion: Optional[str] = None
    privacyVersion: Optional[str] = None
    locationTermsVersion: Optional[str] = None
    marketingConsent: bool = False
    agreedAt: Optional[str] = None
    device: Optional[str] = None
    appVersion: Optional[str] = None


class MarketingConsentUpdateIn(BaseModel):
    marketingConsent: bool


class PolicyDocumentOut(BaseModel):
    type: str          # "terms" | "privacy" | "location" | "marketing"
    version: str
    title: str
    contentUrl: Optional[str] = None
    content: Optional[str] = None
    effectiveDate: str


# ── 공지사항 ─────────────────────────────────
class NoticeOut(BaseModel):
    id: str
    title: str
    content: str
    category: Optional[str] = None
    isPinned: bool = False
    createdAt: str


class NoticeListOut(BaseModel):
    items: List[NoticeOut]


# ── 앱 버전 ──────────────────────────────────
class AppVersionOut(BaseModel):
    platform: str
    latestVersion: str
    minimumVersion: str
    forceUpdate: bool
    updateUrl: Optional[str] = None