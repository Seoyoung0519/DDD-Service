from pydantic import BaseModel, model_validator
from typing import Optional, List

# ── 프로필 요약 ──────────────────────────────────────
class LibrarySummaryOut(BaseModel):
    reviewCount: int
    completedCount: int
    inProgressCount: int


# ── 찜한 도서 ──────────────────────────────────────
class WishBookOut(BaseModel):
    id: str          # user_books.id
    bookId: str
    aladinItemId: Optional[str] = None
    bookTitle: Optional[str] = None
    bookThumbnailUrl: Optional[str] = None
    bookAuthor: Optional[str] = None
    addedAt: Optional[str] = None


class WishBookListOut(BaseModel):
    items: List[WishBookOut]


class WishBookRemoveIn(BaseModel):
    bookId: Optional[str] = None
    aladinItemId: Optional[str] = None

    @model_validator(mode="after")
    def validate_one_of_ids(self):
        if not self.bookId and not self.aladinItemId:
            raise ValueError("bookId 또는 aladinItemId 중 하나는 필수입니다.")
        return self


# ── 완독 도서 ──────────────────────────────────────
class CompletedBookOut(BaseModel):
    bookId: str
    bookTitle: Optional[str] = None
    bookThumbnailUrl: Optional[str] = None
    bookAuthor: Optional[str] = None
    completedAt: Optional[str] = None


class CompletedBookListOut(BaseModel):
    items: List[CompletedBookOut]


# ── 진행 중 도서 ──────────────────────────────────
class InProgressBookOut(BaseModel):
    userBookId: str
    bookId: str
    bookTitle: Optional[str] = None
    bookThumbnailUrl: Optional[str] = None
    bookAuthor: Optional[str] = None
    currentPage: int
    endPage: Optional[int] = None
    progressPercent: float


class InProgressBookListOut(BaseModel):
    items: List[InProgressBookOut]


# ── 독서 캘린더 ──────────────────────────────────
class CalendarDayOut(BaseModel):
    date: str
    bookId: Optional[str] = None
    bookTitle: Optional[str] = None
    bookThumbnailUrl: Optional[str] = None
    readPageStart: Optional[int] = None
    readPageEnd: Optional[int] = None
    proofImageUrl: Optional[str] = None

class CalendarMonthOut(BaseModel):
    year: int
    month: int
    days: List[CalendarDayOut]


# ── 독서 통계 ──────────────────────────────────────
class ReadingStatsOut(BaseModel):
    thisMonthCompleted: int
    consecutiveDays: int
    consecutiveStreak: List[str]