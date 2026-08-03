from pydantic import BaseModel
from typing import Optional, List

class KeyringOut(BaseModel):
    id: str
    userId: str
    bookId: str
    earnedAt: Optional[str] = None
    bookTitle: Optional[str] = None
    bookThumbnailUrl: Optional[str] = None
    prompt: Optional[str] = None
    # ✅ 추가
    imagePath: Optional[str] = None
    imageUrl: Optional[str] = None
    imageStatus: Optional[str] = None
    fallbackSvg: Optional[str] = None

class KeyringListOut(BaseModel):
    items: List[KeyringOut]

class KeyringPromptOut(BaseModel):
    bookId: str
    prompt: str
