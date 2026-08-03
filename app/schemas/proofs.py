# (입력/출력 스키마)
from pydantic import BaseModel, Field
from typing import Optional, Literal, List

class ProofCreateMetaIn(BaseModel):
    # 멀티파트에서 form field로 받기 때문에 Optional로 두고, 서버에서 검증/보정
    bookId: Optional[str] = None
    readingSessionId: Optional[str] = None

    pageNumber: Optional[int] = Field(default=None, ge=1)
    capturedAt: Optional[str] = None  # ISO string (옵션)
    isPublic: bool = False

class ProofOut(BaseModel):
    id: str
    userId: str
    bookId: Optional[str] = None
    readingSessionId: Optional[str] = None

    imagePath: str
    imageUrl: Optional[str] = None

    pageNumber: Optional[int] = None
    capturedAt: Optional[str] = None
    isPublic: bool

    createdAt: Optional[str] = None

class ProofListOut(BaseModel):
    items: List[ProofOut]
