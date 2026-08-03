from pydantic import BaseModel
from typing import Optional, List

class FeedItemOut(BaseModel):
    id: str
    userId: str
    userNickname: Optional[str] = None
    userAvatarUrl: Optional[str] = None

    bookId: str
    bookTitle: Optional[str] = None
    bookThumbnailUrl: Optional[str] = None
    bookAuthor: Optional[str] = None

    reviewId: str
    reviewContent: str

    createdAt: Optional[str] = None

class FeedListOut(BaseModel):
    items: List[FeedItemOut]
    hasMore: bool = False
    nextCursor: Optional[str] = None