from pydantic import BaseModel, Field
from typing import Optional, Literal

class KeyringBadgeCreateIn(BaseModel):
    bookId: str
    # 보통 완독 이벤트로부터 호출하므로 optional
    readingSessionId: Optional[str] = None

class KeyringBadgeOut(BaseModel):
    ok: bool
    bookId: str
    keyringId: str

    prompt: str

    imageStatus: Literal["generated", "fallback", "failed", "pending"]
    imageUrl: Optional[str] = None       # generated면 Storage signed url
    imagePath: Optional[str] = None      # storage path
    fallbackSvg: Optional[str] = None    # fallback이면 SVG string
