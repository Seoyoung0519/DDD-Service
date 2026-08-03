from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from datetime import date, timedelta

from app.deps.auth import get_auth_context, get_db_client
from app.schemas.library import (
    LibrarySummaryOut,
    WishBookListOut, WishBookOut, WishBookRemoveIn,
    CompletedBookListOut, CompletedBookOut,
    InProgressBookListOut, InProgressBookOut,
    CalendarMonthOut, CalendarDayOut,
    ReadingStatsOut,
)
from app.services.storage import get_proof_access_url

router = APIRouter(prefix="/library", tags=["library"])


def _build_author(book: dict) -> str:
    authors = book.get("authors") or []
    if isinstance(authors, list):
        return ", ".join(str(a) for a in authors if a)
    return str(authors)


def resolve_book_by_identifier(
    sb: Client,
    *,
    book_id: str | None = None,
    aladin_item_id: str | None = None,
) -> dict:
    if book_id:
        rows = (
            sb.table("books")
            .select("id,aladin_item_id")
            .eq("id", book_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Book not found")
        return rows[0]

    if aladin_item_id:
        rows = (
            sb.table("books")
            .select("id,aladin_item_id")
            .eq("aladin_item_id", aladin_item_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Book not found by aladinItemId")
        return rows[0]

    raise HTTPException(status_code=400, detail="bookId 또는 aladinItemId 중 하나는 필수입니다.")


# ── 프로필 요약 ────────────────────────────────────────────────────────────────
@router.get("/summary", response_model=LibrarySummaryOut)
def get_library_summary(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]

    review_resp = (
        sb.table("reviews").select("id", count="exact")
        .eq("user_id", user_id).execute()
    )
    completed_resp = (
        sb.table("user_books").select("id", count="exact")
        .eq("user_id", user_id).eq("status", "completed").execute()
    )
    in_progress_resp = (
        sb.table("user_books").select("id", count="exact")
        .eq("user_id", user_id).eq("status", "reading").execute()
    )

    return LibrarySummaryOut(
        reviewCount=review_resp.count or 0,
        completedCount=completed_resp.count or 0,
        inProgressCount=in_progress_resp.count or 0,
    )


# ── 찜한 도서 ─────────────────────────────────────────────────────────────────
@router.get("/wishlist", response_model=WishBookListOut)
def get_wishlist(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]

    rows = (
        sb.table("user_books")
        .select("id,book_id,created_at")
        .eq("user_id", user_id)
        .eq("status", "wish")
        .order("created_at", desc=True)
        .execute()
        .data or []
    )

    if not rows:
        return WishBookListOut(items=[])

    book_ids = [r["book_id"] for r in rows]
    b_rows = (
        sb.table("books")
        .select("id,aladin_item_id,title,thumbnail_url,authors")
        .in_("id", book_ids)
        .execute()
        .data or []
    )
    book_map = {b["id"]: b for b in b_rows}

    items = []
    for r in rows:
        b = book_map.get(r["book_id"], {})
        items.append(WishBookOut(
            id=r["id"],
            bookId=r["book_id"],
            aladinItemId=b.get("aladin_item_id"),
            bookTitle=b.get("title"),
            bookThumbnailUrl=b.get("thumbnail_url"),
            bookAuthor=_build_author(b),
            addedAt=r.get("created_at"),
        ))
    return WishBookListOut(items=items)


@router.delete("/wishlist", status_code=204)
def remove_from_wishlist(
    body: WishBookRemoveIn,
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    """찜 목록에서 제거: bookId 또는 aladinItemId 사용 가능"""
    user_id = auth_ctx["user_id"]

    book = resolve_book_by_identifier(
        sb,
        book_id=body.bookId,
        aladin_item_id=body.aladinItemId,
    )

    sb.table("user_books") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("book_id", book["id"]) \
        .eq("status", "wish") \
        .execute()


# ── 완독 도서 ─────────────────────────────────────────────────────────────────
@router.get("/completed", response_model=CompletedBookListOut)
def get_completed_books(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]

    rows = (
        sb.table("user_books")
        .select("book_id,completed_at")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .order("completed_at", desc=True)
        .execute()
        .data or []
    )

    if not rows:
        return CompletedBookListOut(items=[])

    book_ids = [r["book_id"] for r in rows]
    b_rows = (
        sb.table("books").select("id,title,thumbnail_url,authors")
        .in_("id", book_ids).execute().data or []
    )
    book_map = {b["id"]: b for b in b_rows}

    items = []
    for r in rows:
        b = book_map.get(r["book_id"], {})
        items.append(CompletedBookOut(
            bookId=r["book_id"],
            bookTitle=b.get("title"),
            bookThumbnailUrl=b.get("thumbnail_url"),
            bookAuthor=_build_author(b),
            completedAt=r.get("completed_at"),
        ))
    return CompletedBookListOut(items=items)


# ── 진행 중 도서 ──────────────────────────────────────────────────────────────
@router.get("/in-progress", response_model=InProgressBookListOut)
def get_in_progress_books(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]

    rows = (
        sb.table("user_books")
        .select("id,book_id,current_page,end_page,updated_at")
        .eq("user_id", user_id)
        .eq("status", "reading")
        .order("updated_at", desc=True)
        .execute()
        .data or []
    )

    if not rows:
        return InProgressBookListOut(items=[])

    book_ids = [r["book_id"] for r in rows]
    b_rows = (
        sb.table("books").select("id,title,thumbnail_url,authors")
        .in_("id", book_ids).execute().data or []
    )
    book_map = {b["id"]: b for b in b_rows}

    items = []
    for r in rows:
        b = book_map.get(r["book_id"], {})
        current = r.get("current_page") or 0
        end = r.get("end_page") or 0
        percent = round((current / end * 100), 1) if end > 0 else 0.0
        items.append(InProgressBookOut(
            userBookId=r["id"],
            bookId=r["book_id"],
            bookTitle=b.get("title"),
            bookThumbnailUrl=b.get("thumbnail_url"),
            bookAuthor=_build_author(b),
            currentPage=current,
            endPage=end if end > 0 else None,
            progressPercent=percent,
        ))
    return InProgressBookListOut(items=items)


# ── 독서 캘린더 ───────────────────────────────────────────────────────────────
@router.get("/calendar", response_model=CalendarMonthOut)
def get_reading_calendar(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
):
    """
    해당 월의 독서 세션 날짜별 데이터 반환.
    reading_sessions 테이블의 started_at 기준으로 날짜 집계.
    """
    user_id = auth_ctx["user_id"]

    start = date(year, month, 1).isoformat()
    if month == 12:
        end = date(year + 1, 1, 1).isoformat()
    else:
        end = date(year, month + 1, 1).isoformat()

    sessions = (
        sb.table("reading_sessions")
        .select("id,book_id,started_at,actual_start_page,actual_end_page")
        .eq("user_id", user_id)
        .gte("started_at", start)
        .lt("started_at", end)
        .order("started_at", desc=False)
        .execute()
        .data or []
    )

    proofs = (
            sb.table("read_proofs")
            .select("reading_session_id,image_path")
            .eq("user_id", user_id)
            .execute()
            .data
            or []
    )

    proof_map = {}

    for p in proofs:
        rsid = p.get("reading_session_id")
        if rsid:
            proof_map[rsid] = p


    if not sessions:
        return CalendarMonthOut(year=year, month=month, days=[])

    book_ids = list({s["book_id"] for s in sessions if s.get("book_id")})
    b_rows = (
        sb.table("books").select("id,title,thumbnail_url")
        .in_("id", book_ids).execute().data or []
    )
    book_map = {b["id"]: b for b in b_rows}

    day_map: dict = {}
    for s in sessions:
        day_str = (s["started_at"] or "")[:10]
        day_map[day_str] = s

    days = []
    for day_str, s in sorted(day_map.items()):
        b = book_map.get(s.get("book_id", ""), {})
        proof = proof_map.get(s.get("id"))

        proof_url = None

        if proof:
            proof_url = get_proof_access_url(
                sb,
                proof["image_path"]
            )

        days.append(CalendarDayOut(
            date=day_str,
            bookId=s.get("book_id"),
            bookTitle=b.get("title"),
            bookThumbnailUrl=b.get("thumbnail_url"),
            readPageStart=s.get("actual_start_page"),
            readPageEnd=s.get("actual_end_page"),
            proofImageUrl=proof_url,
        ))



    return CalendarMonthOut(year=year, month=month, days=days)


# ── 독서 통계 ─────────────────────────────────────────────────────────────────
@router.get("/stats", response_model=ReadingStatsOut)
def get_reading_stats(
    auth_ctx: dict = Depends(get_auth_context),
    sb: Client = Depends(get_db_client),
):
    user_id = auth_ctx["user_id"]
    today = date.today()
    month_start = date(today.year, today.month, 1).isoformat()

    completed_resp = (
        sb.table("user_books").select("id", count="exact")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .gte("completed_at", month_start)
        .execute()
    )
    this_month_completed = completed_resp.count or 0

    sessions = (
        sb.table("reading_sessions")
        .select("started_at")
        .eq("user_id", user_id)
        .gte("started_at", month_start)
        .execute()
        .data or []
    )

    active_dates = sorted({s["started_at"][:10] for s in sessions if s.get("started_at")})

    active_set = set(active_dates)
    streak = 0
    cursor_day = today
    while cursor_day.isoformat() in active_set:
        streak += 1
        cursor_day -= timedelta(days=1)

    return ReadingStatsOut(
        thisMonthCompleted=this_month_completed,
        consecutiveDays=streak,
        consecutiveStreak=active_dates,
    )