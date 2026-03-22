/**
 * 피드 API — `LIBRARY_API_BASE_URL` (기본 https://daedokdan-api-8s8k.onrender.com)
 * GET `/feed` — 전체 공개 리뷰 최신순
 */
import { libraryAuthedFetch } from '@/src/api/library';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export type FeedItemOut = {
  id: string;
  userId: string;
  userNickname?: string | null;
  userAvatarUrl?: string | null;
  bookId: string;
  bookTitle?: string | null;
  bookThumbnailUrl?: string | null;
  bookAuthor?: string | null;
  reviewId: string;
  reviewContent: string;
  createdAt?: string | null;
};

export type FeedListOut = {
  items: FeedItemOut[];
  hasMore: boolean;
  nextCursor?: string | null;
};

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function normalizeFeedItem(raw: unknown): FeedItemOut | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = str(o.id);
  const userId = str(o.userId ?? o.user_id);
  const bookId = str(o.bookId ?? o.book_id);
  const reviewId = str(o.reviewId ?? o.review_id ?? o.id);
  const reviewContent = str(o.reviewContent ?? o.review_content ?? o.content);
  if (!id || !userId || !bookId || !reviewContent) return null;

  return {
    id,
    userId,
    userNickname:
      o.userNickname != null
        ? String(o.userNickname)
        : o.user_nickname != null
          ? String(o.user_nickname)
          : null,
    userAvatarUrl:
      o.userAvatarUrl != null
        ? String(o.userAvatarUrl)
        : o.user_avatar_url != null
          ? String(o.user_avatar_url)
          : null,
    bookId,
    bookTitle: o.bookTitle != null ? String(o.bookTitle) : o.book_title != null ? String(o.book_title) : null,
    bookThumbnailUrl:
      o.bookThumbnailUrl != null
        ? String(o.bookThumbnailUrl)
        : o.book_thumbnail_url != null
          ? String(o.book_thumbnail_url)
          : null,
    bookAuthor: o.bookAuthor != null ? String(o.bookAuthor) : o.book_author != null ? String(o.book_author) : null,
    reviewId: reviewId || id,
    reviewContent,
    createdAt:
      o.createdAt != null ? String(o.createdAt) : o.created_at != null ? String(o.created_at) : null,
  };
}

function normalizeFeedList(raw: unknown): FeedListOut {
  let o = asRecord(raw);
  if (o?.data != null && typeof o.data === 'object' && !Array.isArray(o.data)) {
    o = asRecord(o.data) ?? o;
  }

  const itemsRaw = o?.items;
  const arr = Array.isArray(itemsRaw) ? itemsRaw : [];
  const items = arr.map(normalizeFeedItem).filter((x): x is FeedItemOut => x != null);

  const hasMore = Boolean(o?.hasMore ?? o?.has_more);
  const nextRaw = o?.nextCursor ?? o?.next_cursor;
  const nextCursor = nextRaw != null && String(nextRaw).length > 0 ? String(nextRaw) : null;

  return { items, hasMore, nextCursor };
}

export type FetchFeedParams = {
  limit?: number;
  cursor?: string | null;
  /** 있으면 해당 도서의 피드만 (서버가 `bookId` 쿼리를 지원할 때) */
  bookId?: string | null;
};

/**
 * GET `/feed?limit=&cursor=&bookId=`
 */
export async function fetchFeed(params: FetchFeedParams = {}): Promise<FeedListOut> {
  const search = new URLSearchParams();
  if (params.limit != null && params.limit > 0) {
    search.set('limit', String(Math.min(50, Math.max(1, params.limit))));
  }
  if (params.cursor != null && String(params.cursor).trim().length > 0) {
    search.set('cursor', String(params.cursor).trim());
  }
  const bid = params.bookId != null ? String(params.bookId).trim() : '';
  if (bid.length > 0) {
    search.set('bookId', bid);
  }
  const qs = search.toString();
  const path = `/feed${qs ? `?${qs}` : ''}`;

  const res = await libraryAuthedFetch(path, { method: 'GET' });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t?.trim() || `피드 조회 실패 (HTTP ${res.status})`);
  }

  const json: unknown = await res.json().catch(() => ({}));
  return normalizeFeedList(json);
}
