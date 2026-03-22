/**
 * 내 서재 — 확장 API (`LIBRARY_API_BASE_URL`, 기본 daedokdan-api-8s8k)
 *
 * - GET `/library/summary` — 상단 요약 (reviewCount, completedCount, inProgressCount)
 * - GET `/library/in-progress` — 진행 중 도서
 * - GET `/library/completed` — 완독 도서 (`CompletedBookListOut`: `{ items: CompletedBookOut[] }`)
 * - GET `/library/wishlist` — 찜한 책 (`WishBookListOut`: `{ items: WishBookOut[] }`)
 * - GET `/library/calendar?year=&month=` — 월별 독서 캘린더 (`CalendarMonthOut`)
 * - GET `/library/stats` — 대독 통계 (`ReadingStatsOut`)
 * - POST `LIBRARY_WISHLIST_ADD_PATH` (기본 `/library/wishlist/items`) — 찜 추가
 */
import { LIBRARY_API_BASE_URL, LIBRARY_WISHLIST_ADD_PATH } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';

export type LibrarySummaryOut = {
  reviewCount: number;
  completedCount: number;
  inProgressCount: number;
};

const SUMMARY_PATH = '/library/summary';

/** 확장 호스트(`LIBRARY_API_BASE_URL`)에 Bearer + 선택 `x-api-key`로 요청 — `/reviews` 등에서 재사용 */
export async function libraryAuthedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getMainApiAccessToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  };

  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const url = `${LIBRARY_API_BASE_URL}${path}`;
  return fetch(url, {
    ...init,
    headers,
  });
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function normalizeSummary(raw: unknown): LibrarySummaryOut {
  let o = asRecord(raw);
  if (o?.data != null && typeof o.data === 'object') {
    o = asRecord(o.data) ?? o;
  }

  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    reviewCount: num(o?.reviewCount),
    completedCount: num(o?.completedCount),
    inProgressCount: num(o?.inProgressCount),
  };
}

/**
 * GET /library/summary
 */
export async function fetchLibrarySummary(): Promise<LibrarySummaryOut> {
  const res = await libraryAuthedFetch(SUMMARY_PATH, { method: 'GET' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text?.trim() || `내 서재 요약 조회 실패 (HTTP ${res.status})`,
    );
  }

  const json: unknown = await res.json().catch(() => ({}));
  return normalizeSummary(json);
}

// --- GET /library/in-progress ---

export type InProgressBookOut = {
  userBookId: string;
  bookId: string;
  bookTitle?: string | null;
  bookThumbnailUrl?: string | null;
  bookAuthor?: string | null;
  currentPage: number;
  endPage?: number | null;
  progressPercent: number;
};

const IN_PROGRESS_PATH = '/library/in-progress';

function extractItemsArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const o = asRecord(raw);
  if (!o) return [];
  if (Array.isArray(o.items)) return o.items;
  const data = o.data;
  if (data != null && typeof data === 'object' && !Array.isArray(data)) {
    const d = asRecord(data);
    if (Array.isArray(d?.items)) return d.items;
  }
  return [];
}

function normalizeInProgressBook(raw: unknown): InProgressBookOut | null {
  const o = asRecord(raw);
  if (!o) return null;

  const str = (v: unknown) => (v == null ? '' : String(v).trim());
  const userBookId = str(o.userBookId ?? o.user_book_id);
  const bookId = str(o.bookId ?? o.book_id);
  if (!userBookId || !bookId) return null;

  const num = (v: unknown, fallback = 0) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const endRaw = o.endPage ?? o.end_page;
  const endParsed =
    endRaw == null || endRaw === '' ? null : num(endRaw, NaN);
  const safeEndPage =
    endParsed != null && Number.isFinite(endParsed) && endParsed > 0 ? endParsed : null;

  const titleRaw = o.bookTitle ?? o.book_title;
  const thumbRaw = o.bookThumbnailUrl ?? o.book_thumbnail_url;
  const authorRaw = o.bookAuthor ?? o.book_author;

  const progressRaw = o.progressPercent ?? o.progress_percent;
  let progressPercent = num(progressRaw, 0);
  if (!Number.isFinite(progressPercent)) progressPercent = 0;

  return {
    userBookId,
    bookId,
    bookTitle: titleRaw != null && String(titleRaw).length > 0 ? String(titleRaw) : null,
    bookThumbnailUrl: thumbRaw != null && String(thumbRaw).length > 0 ? String(thumbRaw) : null,
    bookAuthor: authorRaw != null && String(authorRaw).length > 0 ? String(authorRaw) : null,
    currentPage: num(o.currentPage ?? o.current_page, 0),
    endPage: safeEndPage,
    progressPercent,
  };
}

/**
 * GET /library/in-progress
 */
export async function fetchLibraryInProgressBooks(): Promise<InProgressBookOut[]> {
  const res = await libraryAuthedFetch(IN_PROGRESS_PATH, { method: 'GET' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text?.trim() || `진행 중인 도서 조회 실패 (HTTP ${res.status})`,
    );
  }

  const json: unknown = await res.json().catch(() => ({}));
  const arr = extractItemsArray(json);
  return arr.map(normalizeInProgressBook).filter((x): x is InProgressBookOut => x != null);
}

// --- GET /library/completed ---

export type CompletedBookOut = {
  bookId: string;
  bookTitle?: string | null;
  bookThumbnailUrl?: string | null;
  bookAuthor?: string | null;
  completedAt?: string | null;
};

const COMPLETED_PATH = '/library/completed';

function normalizeCompletedBook(raw: unknown): CompletedBookOut | null {
  const o = asRecord(raw);
  if (!o) return null;

  const str = (v: unknown) => (v == null ? '' : String(v).trim());
  const bookId = str(o.bookId ?? o.book_id);
  if (!bookId) return null;

  const titleRaw = o.bookTitle ?? o.book_title;
  const thumbRaw = o.bookThumbnailUrl ?? o.book_thumbnail_url;
  const authorRaw = o.bookAuthor ?? o.book_author;
  const atRaw = o.completedAt ?? o.completed_at;

  return {
    bookId,
    bookTitle: titleRaw != null && String(titleRaw).length > 0 ? String(titleRaw) : null,
    bookThumbnailUrl: thumbRaw != null && String(thumbRaw).length > 0 ? String(thumbRaw) : null,
    bookAuthor: authorRaw != null && String(authorRaw).length > 0 ? String(authorRaw) : null,
    completedAt: atRaw != null && String(atRaw).length > 0 ? String(atRaw) : null,
  };
}

/**
 * GET `/library/completed`
 * 응답: `{ items: CompletedBookOut[] }` (래핑 없는 배열도 `extractItemsArray`에서 처리)
 */
export async function fetchLibraryCompletedBooks(): Promise<CompletedBookOut[]> {
  const res = await libraryAuthedFetch(COMPLETED_PATH, { method: 'GET' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text?.trim() || `완독 도서 목록 조회 실패 (HTTP ${res.status})`,
    );
  }

  const json: unknown = await res.json().catch(() => ({}));
  const arr = extractItemsArray(json);
  return arr.map(normalizeCompletedBook).filter((x): x is CompletedBookOut => x != null);
}

// --- GET /library/wishlist ---

export type WishBookOut = {
  /** user_book 등 찜 레코드 id */
  id: string;
  bookId: string;
  bookTitle?: string | null;
  bookThumbnailUrl?: string | null;
  bookAuthor?: string | null;
  addedAt?: string | null;
};

const WISHLIST_PATH = '/library/wishlist';

function normalizeWishBook(raw: unknown): WishBookOut | null {
  const o = asRecord(raw);
  if (!o) return null;

  const str = (v: unknown) => (v == null ? '' : String(v).trim());
  const id = str(o.id);
  const bookId = str(o.bookId ?? o.book_id);
  if (!id || !bookId) return null;

  const titleRaw = o.bookTitle ?? o.book_title;
  const thumbRaw = o.bookThumbnailUrl ?? o.book_thumbnail_url;
  const authorRaw = o.bookAuthor ?? o.book_author;
  const atRaw = o.addedAt ?? o.added_at;

  return {
    id,
    bookId,
    bookTitle: titleRaw != null && String(titleRaw).length > 0 ? String(titleRaw) : null,
    bookThumbnailUrl: thumbRaw != null && String(thumbRaw).length > 0 ? String(thumbRaw) : null,
    bookAuthor: authorRaw != null && String(authorRaw).length > 0 ? String(authorRaw) : null,
    addedAt: atRaw != null && String(atRaw).length > 0 ? String(atRaw) : null,
  };
}

/**
 * GET `/library/wishlist`
 * 응답: `{ items: WishBookOut[] }`
 */
export async function fetchLibraryWishlist(): Promise<WishBookOut[]> {
  const res = await libraryAuthedFetch(WISHLIST_PATH, { method: 'GET' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text?.trim() || `찜한 도서 목록 조회 실패 (HTTP ${res.status})`);
  }

  const json: unknown = await res.json().catch(() => ({}));
  const arr = extractItemsArray(json);
  return arr.map(normalizeWishBook).filter((x): x is WishBookOut => x != null);
}

// --- GET /library/calendar ---

const CALENDAR_PATH = '/library/calendar';

/** API `CalendarDayOut` */
export type CalendarDayOut = {
  date: string;
  bookId?: string | null;
  bookTitle?: string | null;
  bookThumbnailUrl?: string | null;
  readPageStart?: number | null;
  readPageEnd?: number | null;
};

export type CalendarMonthOut = {
  year: number;
  month: number;
  days: CalendarDayOut[];
};

function normalizeCalendarDay(raw: unknown): CalendarDayOut | null {
  const o = asRecord(raw);
  if (!o) return null;
  const date = String(o.date ?? '').trim();
  if (!date) return null;

  const strN = (v: unknown) => {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const bid = o.bookId ?? o.book_id;
  const title = o.bookTitle ?? o.book_title;
  const thumb = o.bookThumbnailUrl ?? o.book_thumbnail_url;
  const rs = o.readPageStart ?? o.read_page_start;
  const re = o.readPageEnd ?? o.read_page_end;

  return {
    date,
    bookId: bid != null && String(bid).trim() ? String(bid).trim() : null,
    bookTitle: title != null && String(title).trim() ? String(title).trim() : null,
    bookThumbnailUrl: thumb != null && String(thumb).trim() ? String(thumb).trim() : null,
    readPageStart: strN(rs),
    readPageEnd: strN(re),
  };
}

function normalizeCalendarMonth(raw: unknown): CalendarMonthOut | null {
  let o = asRecord(raw);
  if (o?.data != null && typeof o.data === 'object') {
    o = asRecord(o.data) ?? o;
  }
  if (!o) return null;

  const year = typeof o.year === 'number' ? o.year : Number(o.year);
  const month = typeof o.month === 'number' ? o.month : Number(o.month);
  const daysRaw = o.days;
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Array.isArray(daysRaw)) {
    return null;
  }

  const days = daysRaw
    .map(normalizeCalendarDay)
    .filter((x): x is CalendarDayOut => x != null);

  return { year, month, days };
}

/**
 * `days[].date` (YYYY-MM-DD) → 해당 월의 **일(1~31)** 키로 인덱싱 (표시·모달용)
 */
export function indexCalendarDaysByDayOfMonth(days: CalendarDayOut[]): Record<number, CalendarDayOut> {
  const out: Record<number, CalendarDayOut> = {};
  for (const d of days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d.date.trim());
    if (!m) continue;
    const dayNum = parseInt(m[3], 10);
    if (Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 31) {
      out[dayNum] = d;
    }
  }
  return out;
}

/** 해당 일에 독서 기록(책)이 있으면 true */
export function calendarDayHasReading(entry: CalendarDayOut | undefined): boolean {
  if (!entry) return false;
  return Boolean(
    (entry.bookId && entry.bookId.trim()) ||
      (entry.bookTitle && entry.bookTitle.trim()) ||
      (entry.bookThumbnailUrl && entry.bookThumbnailUrl.trim()),
  );
}

/** 월 그리드용 인덱스 맵에 읽은 책이 하루라도 있으면 true */
export function calendarIndexedHasAnyReading(
  byDay: Record<number, CalendarDayOut>,
): boolean {
  for (const day of Object.values(byDay)) {
    if (calendarDayHasReading(day)) return true;
  }
  return false;
}

/** HTTP 오류 본문 → 사용자 메시지 (500 시 영문 "Internal Server Error" 대신 안내 문구) */
async function parseLibraryHttpErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const status = res.status;
  const text = await res.text().catch(() => '');
  const trimmed = text?.trim() ?? '';

  const fromJson = (raw: string): string | null => {
    try {
      const j = JSON.parse(raw) as Record<string, unknown>;
      const msg =
        typeof j.message === 'string'
          ? j.message
          : typeof j.error === 'string'
            ? j.error
            : typeof j.detail === 'string'
              ? j.detail
              : null;
      return msg?.trim() || null;
    } catch {
      return null;
    }
  };

  if (status >= 500) {
    const jm = trimmed && !trimmed.startsWith('<') ? fromJson(trimmed) : null;
    if (jm && !/^internal server error$/i.test(jm)) {
      return jm;
    }
    return '서버에 일시적인 오류가 있습니다. 잠시 후 다시 시도해 주세요.';
  }

  if (trimmed && !trimmed.startsWith('<')) {
    const jm = fromJson(trimmed);
    if (jm) return jm;
    if (trimmed.length <= 400) return trimmed;
  }

  return `${fallback} (HTTP ${status})`;
}

/**
 * GET `/library/calendar?year=&month=` — 월별 독서 캘린더 (기준: reading_sessions.started_at)
 * @param month 1~12
 */
export async function fetchLibraryCalendar(year: number, month: number): Promise<CalendarMonthOut> {
  const y = Math.floor(year);
  const m = Math.floor(month);
  if (!Number.isFinite(y) || m < 1 || m > 12) {
    throw new Error('연도·월이 올바르지 않습니다.');
  }

  const path = `${CALENDAR_PATH}?year=${y}&month=${m}`;
  const res = await libraryAuthedFetch(path, { method: 'GET' });

  if (!res.ok) {
    const msg = await parseLibraryHttpErrorMessage(res, '독서 캘린더 조회 실패');
    throw new Error(msg);
  }

  const json: unknown = await res.json().catch(() => ({}));
  const normalized = normalizeCalendarMonth(json);
  if (!normalized) {
    throw new Error('독서 캘린더 응답 형식이 올바르지 않습니다.');
  }
  return normalized;
}

// --- GET /library/stats ---

const STATS_PATH = '/library/stats';

/** API `ReadingStatsOut` — 문서 3-7 */
export type ReadingStatsOut = {
  thisMonthCompleted: number;
  consecutiveDays: number;
  /** 이번 달 `started_at` 기준 active 날짜 전체(정렬된 YYYY-MM-DD[]) */
  consecutiveStreak: string[];
};

function normalizeReadingStats(raw: unknown): ReadingStatsOut | null {
  let o = asRecord(raw);
  if (o?.data != null && typeof o.data === 'object') {
    o = asRecord(o.data) ?? o;
  }
  if (!o) return null;

  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const streakRaw = o.consecutiveStreak ?? o.consecutive_streak;
  const consecutiveStreak = Array.isArray(streakRaw)
    ? streakRaw.map((s) => String(s).trim()).filter(Boolean)
    : [];

  return {
    thisMonthCompleted: num(o.thisMonthCompleted ?? o.this_month_completed),
    consecutiveDays: num(o.consecutiveDays ?? o.consecutive_days),
    consecutiveStreak,
  };
}

/**
 * GET `/library/stats` — 독서 통계 (이번 달 완독 수, 연속 일수, 이번 달 독서일 목록)
 */
export async function fetchLibraryStats(): Promise<ReadingStatsOut> {
  const res = await libraryAuthedFetch(STATS_PATH, { method: 'GET' });

  if (!res.ok) {
    const msg = await parseLibraryHttpErrorMessage(res, '독서 통계 조회 실패');
    throw new Error(msg);
  }

  const json: unknown = await res.json().catch(() => ({}));
  const normalized = normalizeReadingStats(json);
  if (!normalized) {
    throw new Error('독서 통계 응답 형식이 올바르지 않습니다.');
  }
  return normalized;
}

export type AddLibraryWishlistResult = {
  /** 이미 찜 목록에 있을 때 true (409 또는 응답 필드) */
  alreadyExists: boolean;
};

/**
 * POST 찜한 도서에 추가 — 경로는 `LIBRARY_WISHLIST_ADD_PATH` (기본 `/library/wishlist/items`).
 * `POST /library/wishlist` 만으로는 405가 나는 경우가 많음 (GET 전용).
 * - Body: `{ "bookId": "<books.id>" }`
 * - 중복 시 HTTP 409 또는 `{ alreadyExists: true }` 를 가정
 */
export async function addBookToLibraryWishlist(bookId: string): Promise<AddLibraryWishlistResult> {
  const trimmed = bookId.trim();
  if (!trimmed) {
    throw new Error('도서 ID가 없습니다.');
  }

  const res = await libraryAuthedFetch(LIBRARY_WISHLIST_ADD_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId: trimmed }),
  });

  if (res.status === 409) {
    return { alreadyExists: true };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const hint =
      res.status === 405
        ? ' (찜 추가 경로가 다를 수 있습니다. EXPO_PUBLIC_LIBRARY_WISHLIST_ADD_PATH 확인)'
        : '';
    throw new Error((text?.trim() || `찜한 도서에 담기 실패 (HTTP ${res.status})`) + hint);
  }

  const json: unknown = await res.json().catch(() => ({}));
  const o = asRecord(json);
  const data = o?.data != null && typeof o.data === 'object' ? asRecord(o.data) : o;
  const already =
    data?.alreadyExists === true ||
    data?.already_exists === true ||
    o?.alreadyExists === true ||
    o?.already_exists === true;
  return { alreadyExists: Boolean(already) };
}
