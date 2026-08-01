/**
 * 내 서재 — 확장 API (`LIBRARY_API_BASE_URL`, 기본 daedokdan-api-8s8k)
 *
 * - GET `/library/summary` — 상단 요약 (reviewCount, completedCount, inProgressCount)
 * - GET `/library/in-progress` — 진행 중 도서
 * - GET `/library/completed` — 완독 도서 (`CompletedBookListOut`: `{ items: CompletedBookOut[] }`)
 * - GET `/library/wishlist` — 찜한 책 (`WishBookListOut`: `{ items: WishBookOut[] }`)
 * - DELETE `/library/wishlist` — 찜 제거 (body: `{ bookId }`, 204)
 * - GET `/library/calendar?year=&month=` — 월별 독서 캘린더 (`CalendarMonthOut`, 인증샷 URL 포함 가능)
 * - GET `/library/stats` — 대독 통계 (`ReadingStatsOut`)
 * - POST `LIBRARY_WISHLIST_ADD_PATH` (기본 `/library/wishlist/items`) — 찜 추가
 */
import { LIBRARY_API_BASE_URL, LIBRARY_WISHLIST_ADD_PATH, PROOF_API_BASE_URL } from '@/src/config/api';
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
  /** 서재/도서 테이블의 책 id (UUID 등) */
  bookId: string;
  /**
   * 알라딘 ItemId — 있으면 `GET /api/books/:id`·검색 상세와 동일하게 품번으로 열 수 있음.
   * 백엔드가 내려주지 않으면 `bookId`만 사용.
   */
  aladinItemId?: string | null;
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

  const aladinRaw = o.aladinItemId ?? o.aladin_item_id ?? o.aladin_itemId;
  const aladinItemId =
    aladinRaw != null && String(aladinRaw).trim() ? String(aladinRaw).trim() : null;

  const titleRaw = o.bookTitle ?? o.book_title;
  const thumbRaw = o.bookThumbnailUrl ?? o.book_thumbnail_url;
  const authorRaw = o.bookAuthor ?? o.book_author;
  const atRaw = o.addedAt ?? o.added_at;

  return {
    id,
    bookId,
    aladinItemId,
    bookTitle: titleRaw != null && String(titleRaw).length > 0 ? String(titleRaw) : null,
    bookThumbnailUrl: thumbRaw != null && String(thumbRaw).length > 0 ? String(thumbRaw) : null,
    bookAuthor: authorRaw != null && String(authorRaw).length > 0 ? String(authorRaw) : null,
    addedAt: atRaw != null && String(atRaw).length > 0 ? String(atRaw) : null,
  };
}

/** 찜 목록 → 도서 상세 라우트용 id (알라딘 품번 우선, 없으면 bookId) */
export function wishlistBookDetailRouteId(b: WishBookOut): string {
  const a = b.aladinItemId?.trim();
  if (a) return a;
  return b.bookId.trim();
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

/**
 * DELETE `/library/wishlist` — 본문 `{ bookId }` (fetch는 DELETE + body 지원)
 * 성공 시 204 No Content
 */
export async function removeFromLibraryWishlist(
  bookId: string,
  options?: { aladinItemId?: string | null },
): Promise<void> {
  const trimmed = bookId.trim();
  if (!trimmed) {
    throw new Error('도서 ID가 없습니다.');
  }

  const aladin = options?.aladinItemId?.trim();
  const body: Record<string, string> = { bookId: trimmed };
  if (aladin) body.aladin_item_id = aladin;

  const res = await libraryAuthedFetch(WISHLIST_PATH, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 204 || res.ok) {
    return;
  }

  const text = await res.text().catch(() => '');
  throw new Error(text?.trim() || `찜한 도서 제거 실패 (HTTP ${res.status})`);
}

// --- GET /library/calendar ---

const CALENDAR_PATH = '/library/calendar';

const PROOF_MEDIA_BASE_URL =
  process.env.EXPO_PUBLIC_PROOF_MEDIA_BASE_URL ?? PROOF_API_BASE_URL;

/** 상대 `image_path` → RN Image용 절대 URL */
function resolveProofImageUrl(rawPath: string): string {
  const s = rawPath.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  const base = PROOF_MEDIA_BASE_URL.replace(/\/$/, '');
  return s.startsWith('/') ? `${base}${s}` : `${base}/${s}`;
}

/** API `CalendarDayOut` */
export type CalendarDayOut = {
  date: string;
  bookId?: string | null;
  bookTitle?: string | null;
  bookThumbnailUrl?: string | null;
  readPageStart?: number | null;
  readPageEnd?: number | null;
  proofId?: string | null;
  proofImageUrl?: string | null;
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

  const nestedProof =
    asRecord(o.proof) ??
    asRecord(o.readProof) ??
    asRecord(o.read_proof) ??
    asRecord(o.readingProof) ??
    asRecord(o.reading_proof);

  const bid = o.bookId ?? o.book_id;
  const title = o.bookTitle ?? o.book_title;
  const thumb = o.bookThumbnailUrl ?? o.book_thumbnail_url;
  const rs = o.readPageStart ?? o.read_page_start;
  const re = o.readPageEnd ?? o.read_page_end;
  const proofIdRaw =
    o.proofId ??
    o.proof_id ??
    o.readProofId ??
    o.read_proof_id ??
    nestedProof?.id ??
    nestedProof?.proofId ??
    nestedProof?.proof_id;
  let proofId =
    proofIdRaw != null && String(proofIdRaw).trim() ? String(proofIdRaw).trim() : null;

  const proofImgRaw =
    o.proofImageUrl ??
    o.proof_image_url ??
    o.proofUrl ??
    o.proof_url ??
    nestedProof?.imageUrl ??
    nestedProof?.image_url ??
    nestedProof?.imagePath ??
    nestedProof?.image_path ??
    nestedProof?.proofImageUrl ??
    nestedProof?.proof_image_url ??
    // 캘린더 day에 인증샷 URL만 오는 경우 (OpenAPI엔 없을 수 있음)
    o.imageUrl ??
    o.image_url ??
    o.imagePath ??
    o.image_path;

  const proofImageUrl =
    proofImgRaw != null && String(proofImgRaw).trim()
      ? resolveProofImageUrl(String(proofImgRaw))
      : null;

  // URL 경로에 UUID가 있으면 proofId 후보로 사용
  if (!proofId && proofImageUrl) {
    const uuid = proofImageUrl.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    if (uuid) proofId = uuid[0];
  }

  return {
    date,
    bookId: bid != null && String(bid).trim() ? String(bid).trim() : null,
    bookTitle: title != null && String(title).trim() ? String(title).trim() : null,
    bookThumbnailUrl: thumb != null && String(thumb).trim() ? String(thumb).trim() : null,
    readPageStart: strN(rs),
    readPageEnd: strN(re),
    proofId,
    proofImageUrl,
  };
}

/** GET /library/calendar 응답 — 래핑·키 이름 차이 흡수 */
function unwrapCalendarMonthJson(raw: unknown): Record<string, unknown> | null {
  let o = asRecord(raw);
  if (!o) return null;

  const peel = (obj: Record<string, unknown>): Record<string, unknown> | null => {
    if (Array.isArray(obj.days) && obj.year != null) return obj;

    for (const key of ['data', 'result', 'payload', 'body'] as const) {
      const inner = obj[key];
      if (inner == null || typeof inner !== 'object' || Array.isArray(inner)) continue;
      const ir = asRecord(inner);
      if (!ir) continue;
      if (Array.isArray(ir.days) || (ir.year != null && ir.month != null)) return ir;
      const cal = ir.calendar ?? ir.calendar_month ?? ir.calendarMonth;
      if (cal != null && typeof cal === 'object' && !Array.isArray(cal)) {
        const cr = asRecord(cal);
        if (cr && (Array.isArray(cr.days) || cr.year != null)) return cr;
      }
    }

    for (const key of ['calendar', 'calendar_month', 'calendarMonth'] as const) {
      const cal = obj[key];
      if (cal != null && typeof cal === 'object' && !Array.isArray(cal)) {
        const cr = asRecord(cal);
        if (cr && (Array.isArray(cr.days) || cr.year != null)) return cr;
      }
    }
    return null;
  };

  for (let i = 0; i < 5; i++) {
    const next = peel(o);
    if (!next || next === o) break;
    o = next;
  }

  return o;
}

function normalizeCalendarMonth(raw: unknown): CalendarMonthOut | null {
  const o = unwrapCalendarMonthJson(raw);
  if (!o) return null;

  const year = typeof o.year === 'number' ? o.year : Number(o.year);
  const month = typeof o.month === 'number' ? o.month : Number(o.month);
  const daysRaw = o.days ?? o.calendar_days ?? o.calendarDays ?? o.items;
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
    // YYYY-MM-DD 또는 ISO(`2026-03-05T00:00:00Z`), 월·일 한 자리(`2026-3-5`)도 허용
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(d.date.trim());
    if (!m) continue;
    const dayNum = parseInt(m[3], 10);
    if (Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 31) {
      out[dayNum] = d;
    }
  }
  return out;
}

/** 해당 일에 인증샷이 있으면 true */
export function calendarDayHasProof(entry: CalendarDayOut | undefined): boolean {
  return Boolean(entry?.proofImageUrl?.trim());
}

/** 해당 일에 독서 기록(책)이 있으면 true — 책 메타 없이 페이지만 있어도 세션으로 인정 */
export function calendarDayHasReading(entry: CalendarDayOut | undefined): boolean {
  if (!entry) return false;
  if (calendarDayHasProof(entry)) return true;
  const hasBookMeta = Boolean(
    (entry.bookId && entry.bookId.trim()) ||
      (entry.bookTitle && entry.bookTitle.trim()) ||
      (entry.bookThumbnailUrl && entry.bookThumbnailUrl.trim()),
  );
  const hasPages =
    (entry.readPageStart != null && Number.isFinite(Number(entry.readPageStart))) ||
    (entry.readPageEnd != null && Number.isFinite(Number(entry.readPageEnd)));
  return hasBookMeta || hasPages;
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
    if (__DEV__) {
      const keys =
        json && typeof json === 'object' && !Array.isArray(json)
          ? Object.keys(json as object).join(', ')
          : typeof json;
      console.warn('[fetchLibraryCalendar] 응답 파싱 실패 — 최상위 키:', keys);
    }
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
