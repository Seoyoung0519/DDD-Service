/**
 * 리뷰 API — `LIBRARY_API_BASE_URL` (기본 https://daedokdan-api-8s8k.onrender.com)
 * - POST `/reviews` — 작성
 * - GET `/reviews/my` — 내 리뷰 목록
 * - GET `/reviews/book/{book_id}` — 특정 도서 리뷰 목록 (페이지네이션, 서버 스펙에 맞게 조정 가능)
 * - DELETE `/reviews/{review_id}` — 내 리뷰 삭제 (204)
 */
import { libraryAuthedFetch } from '@/src/api/library';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export type ReviewCreateIn = {
  bookId: string;
  readingStartDate?: string | null;
  readingEndDate?: string | null;
  content: string;
  isPublic: boolean;
};

export type ReviewOut = {
  id: string;
  userId: string;
  userNickname?: string | null;
  userAvatarUrl?: string | null;
  bookId: string;
  bookTitle?: string | null;
  bookThumbnailUrl?: string | null;
  bookAuthor?: string | null;
  readingStartDate?: string | null;
  readingEndDate?: string | null;
  content: string;
  isPublic: boolean;
  createdAt?: string | null;
};

export type ReviewListOut = {
  items: ReviewOut[];
  hasMore: boolean;
  nextCursor?: string | null;
};

function normalizeReviewOut(raw: unknown): ReviewOut | null {
  const o = asRecord(raw);
  if (!o) return null;
  const str = (v: unknown) => (v == null ? '' : String(v).trim());
  const id = str(o.id);
  const userId = str(o.userId ?? o.user_id);
  const bookId = str(o.bookId ?? o.book_id);
  const content = str(o.content);
  if (!id || !userId || !bookId || !content) return null;

  return {
    id,
    userId,
    userNickname: o.userNickname != null ? String(o.userNickname) : o.user_nickname != null ? String(o.user_nickname) : null,
    userAvatarUrl:
      o.userAvatarUrl != null ? String(o.userAvatarUrl) : o.user_avatar_url != null ? String(o.user_avatar_url) : null,
    bookId,
    bookTitle: o.bookTitle != null ? String(o.bookTitle) : o.book_title != null ? String(o.book_title) : null,
    bookThumbnailUrl:
      o.bookThumbnailUrl != null
        ? String(o.bookThumbnailUrl)
        : o.book_thumbnail_url != null
          ? String(o.book_thumbnail_url)
          : null,
    bookAuthor: o.bookAuthor != null ? String(o.bookAuthor) : o.book_author != null ? String(o.book_author) : null,
    readingStartDate:
      o.readingStartDate != null
        ? String(o.readingStartDate)
        : o.reading_start_date != null
          ? String(o.reading_start_date)
          : null,
    readingEndDate:
      o.readingEndDate != null
        ? String(o.readingEndDate)
        : o.reading_end_date != null
          ? String(o.reading_end_date)
          : null,
    content,
    isPublic: Boolean(o.isPublic ?? o.is_public ?? true),
    createdAt: o.createdAt != null ? String(o.createdAt) : o.created_at != null ? String(o.created_at) : null,
  };
}

function normalizeReviewList(raw: unknown): ReviewListOut {
  let o = asRecord(raw);
  if (o?.data != null && typeof o.data === 'object' && !Array.isArray(o.data)) {
    o = asRecord(o.data) ?? o;
  }

  const itemsRaw = o?.items;
  const arr = Array.isArray(itemsRaw) ? itemsRaw : [];
  const items = arr.map(normalizeReviewOut).filter((x): x is ReviewOut => x != null);

  const hasMore = Boolean(o?.hasMore ?? o?.has_more);
  const nextRaw = o?.nextCursor ?? o?.next_cursor;
  const nextCursor = nextRaw != null && String(nextRaw).length > 0 ? String(nextRaw) : null;

  return { items, hasMore, nextCursor };
}

/**
 * POST `/reviews` — 리뷰 작성 (201)
 */
export async function createReview(body: ReviewCreateIn): Promise<ReviewOut> {
  const res = await libraryAuthedFetch('/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookId: body.bookId,
      readingStartDate: body.readingStartDate ?? null,
      readingEndDate: body.readingEndDate ?? null,
      content: body.content,
      isPublic: body.isPublic,
    }),
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    let msg = text?.trim() || `리뷰 작성 실패 (HTTP ${res.status})`;
    try {
      const j = JSON.parse(text) as { detail?: unknown };
      if (j?.detail != null) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* noop */
    }
    throw new Error(msg);
  }

  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  const parsed = normalizeReviewOut(json);
  if (parsed) return parsed;

  throw new Error('리뷰 응답을 해석하지 못했습니다.');
}

export type FetchMyReviewsParams = {
  limit?: number;
  cursor?: string | null;
};

/**
 * GET `/reviews/my`
 */
/** 독서기간 입력에서 `YYYY-MM-DD` 패턴을 추출 (2개면 시작·종료) */
export function parseReadingPeriodDates(input: string): {
  readingStartDate: string | null;
  readingEndDate: string | null;
} {
  const trimmed = input.trim();
  if (!trimmed) return { readingStartDate: null, readingEndDate: null };
  const matches = trimmed.match(/\d{4}-\d{2}-\d{2}/g);
  if (!matches || matches.length === 0) return { readingStartDate: null, readingEndDate: null };
  if (matches.length === 1) return { readingStartDate: matches[0], readingEndDate: null };
  return { readingStartDate: matches[0], readingEndDate: matches[matches.length - 1] };
}

export type FetchBookReviewsParams = {
  bookId: string;
  limit?: number;
  cursor?: string | null;
};

/**
 * GET `/reviews/book/{bookId}` — 해당 도서의 공개 리뷰 (페이지네이션, 응답 형식은 `/reviews/my` 와 동일 가정)
 */
export async function fetchBookReviews(params: FetchBookReviewsParams): Promise<ReviewListOut> {
  const bookId = String(params.bookId ?? '').trim();
  if (!bookId) {
    throw new Error('bookId가 없습니다.');
  }

  const search = new URLSearchParams();
  if (params.limit != null && params.limit > 0) {
    search.set('limit', String(Math.min(50, Math.max(1, params.limit))));
  }
  if (params.cursor != null && String(params.cursor).trim().length > 0) {
    search.set('cursor', String(params.cursor).trim());
  }
  const qs = search.toString();
  const path = `/reviews/book/${encodeURIComponent(bookId)}${qs ? `?${qs}` : ''}`;

  const res = await libraryAuthedFetch(path, { method: 'GET' });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t?.trim() || `도서 리뷰 목록 조회 실패 (HTTP ${res.status})`);
  }

  const json: unknown = await res.json().catch(() => ({}));
  return normalizeReviewList(json);
}

export async function fetchMyReviews(params: FetchMyReviewsParams = {}): Promise<ReviewListOut> {
  const search = new URLSearchParams();
  if (params.limit != null && params.limit > 0) {
    search.set('limit', String(Math.min(50, Math.max(1, params.limit))));
  }
  if (params.cursor != null && String(params.cursor).trim().length > 0) {
    search.set('cursor', String(params.cursor).trim());
  }
  const qs = search.toString();
  const path = `/reviews/my${qs ? `?${qs}` : ''}`;

  const res = await libraryAuthedFetch(path, { method: 'GET' });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t?.trim() || `내 리뷰 목록 조회 실패 (HTTP ${res.status})`);
  }

  const json: unknown = await res.json().catch(() => ({}));
  return normalizeReviewList(json);
}

/**
 * DELETE `/reviews/{review_id}` — 성공 시 `204 No Content`
 */
export async function deleteMyReview(reviewId: string): Promise<void> {
  const id = String(reviewId).trim();
  if (!id) {
    throw new Error('리뷰 ID가 없습니다.');
  }

  const res = await libraryAuthedFetch(`/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (res.ok) {
    return;
  }

  const text = await res.text().catch(() => '');
  let msg = text?.trim() || `리뷰 삭제 실패 (HTTP ${res.status})`;
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (j?.detail != null) {
      msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    }
  } catch {
    /* noop */
  }
  throw new Error(msg);
}
