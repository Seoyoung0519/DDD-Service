from pydantic import BaseModel, Field
from typing import Optional, List

class ReviewCreateIn(BaseModel):
    bookId: str
    readingStartDate: Optional[str] = None   # ISO date "2025-09-01"
    readingEndDate: Optional[str] = None
    content: str = Field(min_length=1, max_length=2000)
    isPublic: bool = True

class ReviewOut(BaseModel):
    id: str
    userId: str
    userNickname: Optional[str] = None
    userAvatarUrl: Optional[str] = None

    bookId: str
    bookTitle: Optional[str] = None
    bookThumbnailUrl: Optional[str] = None
    bookAuthor: Optional[str] = None

    readingStartDate: Optional[str] = None
    readingEndDate: Optional[str] = None
    content: str
    isPublic: bool

    createdAt: Optional[str] = None

class ReviewListOut(BaseModel):
    items: List[ReviewOut]
    hasMore: bool = False
    nextCursor: Optional[str] = None