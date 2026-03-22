import client, { apiClient } from './client';

// ==================== 타입 정의 ====================

export interface SearchBookItem {
  bookId?: string; // 우리 DB의 books.id (uuid) - API 응답에 포함되어 있을 경우
  aladin_item_id: string;
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  cover: string;
  description: string;
  link: string;
  isbn: string;
}

export interface SearchBooksResponse {
  total: number;
  items: SearchBookItem[];
}

export interface BookDetailResponse {
  id: string;
  aladin_item_id: string;
  isbn13: string;
  title: string;
  authors: string[];
  publisher: string;
  published_date: string;
  page_count: number;
  language?: string;
  categories?: string[];
  thumbnail_url: string;
  google_books_id?: string;
  created_at?: string;
  aladin_link?: string;
  purchase_links?: {
    aladin?: string;
    yes24?: string;
    kyobo?: string;
    google_books?: string;
    naver?: string;
  };
  detail?: {
    description?: string;
    author_intro?: string | null;
    publisher_review?: string | null;
  };
}

export interface RecentQuery {
  query: string;
  created_at: string;
}

export interface RecentQueriesResponse {
  items: RecentQuery[];
}

export interface RecentBook {
  book: {
    id: string;
    aladin_item_id: string;
    title: string;
    authors: string[];
    publisher: string;
    published_date: string;
    page_count: number;
    thumbnail_url: string;
  };
  created_at: string;
}

export interface RecentBooksResponse {
  items: RecentBook[];
}

export interface SearchSuggestionsResponse {
  items: string[]; // title만 포함된 배열
}

// ==================== API 함수들 ====================

/**
 * 서버 상태 확인
 */
export const checkHealth = () => apiClient.get<{ status: string }>('/api/health');

/**
 * 도서 검색
 * @param q 검색어
 */
export const searchBooks = (q: string) =>
  apiClient.get<SearchBooksResponse>('/api/search/books', {
    params: { q },
  });

/**
 * 연관 검색어 조회 (제목만) - 검색 API에서 title만 추출
 * @param q 검색어
 */
export const getSearchSuggestions = async (q: string): Promise<{ data: SearchSuggestionsResponse }> => {
  // 검색 API를 호출해서 title만 추출
  const res = await searchBooks(q);
  const titles = res.data.items.slice(0, 10).map((item) => item.title);
  return {
    data: {
      items: titles,
    },
  };
};

/**
 * 도서 상세 정보 조회
 * @param itemId 알라딘 아이템 ID
 * @param skipRecentBook 최근 본 책 저장 건너뛰기 (기본값: false)
 */
export const getBookDetail = (itemId: string, skipRecentBook: boolean = false) =>
  apiClient.get<BookDetailResponse>(`/api/books/${itemId}`, {
    params: skipRecentBook ? { skip_recent_book: 'true' } : undefined,
  });

/**
 * 도서 상세 조회 — 200/404만 성공 응답으로 처리 (404 시 axios 에러·전역 Alert 없음).
 * 내 서재 등에서 넘어온 `bookId`가 DB UUID이고 `/api/books/:id`가 알라딘 ID만 받는 경우 404 후 검색 보강에 사용합니다.
 */
export async function getBookDetailOrNotFound(
  itemId: string,
  skipRecentBook: boolean = false,
): Promise<{ ok: true; data: BookDetailResponse } | { ok: false; status: number }> {
  const res = await client.get<BookDetailResponse>(`/api/books/${itemId}`, {
    params: skipRecentBook ? { skip_recent_book: 'true' } : undefined,
    validateStatus: (status) => status === 200 || status === 404,
  });
  if (res.status === 200) return { ok: true, data: res.data };
  return { ok: false, status: res.status };
}

/** 랭킹/검색 제목 비교용 정규화(공백·대소문자·부호 일부) */
function normalizeTitleKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[…．·・‧]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .trim();
}

/** 검색 쿼리 후보: 전체 제목 / 부제 제거 / 앞부분만 등 */
function buildRankingSearchQueries(title: string, aladinItemId: string, authors?: string): string[] {
  const out: string[] = [];
  const push = (x: string) => {
    const t = x.trim();
    if (t && !out.includes(t)) out.push(t);
  };

  const raw = title.trim();
  if (aladinItemId) push(String(aladinItemId).trim());

  if (raw) {
    push(raw);
    const mainTitle = raw.split(/[：:—\-–|｜]/)[0]?.trim();
    if (mainTitle && mainTitle !== raw) push(mainTitle);
    const noParen = raw.replace(/\s*[\(（][^)）]*[)）]\s*$/, '').trim();
    if (noParen && noParen !== raw) push(noParen);
    if (raw.length > 40) push(raw.slice(0, 40).trim());
    if (raw.length > 28) push(raw.slice(0, 28).trim());
    const firstAuthor = authors?.split(/[,，]/)[0]?.trim();
    if (firstAuthor && mainTitle) push(`${mainTitle} ${firstAuthor}`);
  }

  return out;
}

function pickSearchItemForRanking(
  items: SearchBookItem[],
  aladinItemId: string,
  rankingTitle: string,
  rankingAuthors?: string,
): SearchBookItem | undefined {
  const normRank = normalizeTitleKey(rankingTitle);
  const authorNeedle = rankingAuthors?.split(/[,，]/)[0]?.trim().toLowerCase();

  const sameId = (a: string, b: string) => String(a).trim() === String(b).trim();

  const byAladin = items.find((b) => sameId(b.aladin_item_id, aladinItemId));
  if (byAladin) return byAladin;

  const byBookId = items.find((b) => b.bookId && sameId(b.bookId, aladinItemId));
  if (byBookId) return byBookId;

  const exactTitle = items.find((b) => normalizeTitleKey(b.title) === normRank);
  if (exactTitle) return exactTitle;

  if (normRank.length >= 6) {
    const fuzzy = items.filter((b) => {
      const bt = normalizeTitleKey(b.title);
      return bt.includes(normRank) || normRank.includes(bt);
    });
    if (fuzzy.length === 1) return fuzzy[0];
    if (fuzzy.length > 1 && authorNeedle) {
      const withAuthor = fuzzy.find((b) => b.author?.toLowerCase().includes(authorNeedle));
      if (withAuthor) return withAuthor;
    }
    if (fuzzy.length > 0) return fuzzy[0];
  }

  return undefined;
}

/**
 * 랭킹 등 '검색을 거치지 않은' 진입에서 `/api/books/:id` 가 404 나는 경우 대응.
 * 백엔드는 먼저 `/api/search/books` 로 도서가 로컬 DB에 있어야 상세 조회를 허용하는 경우가 있음.
 *
 * 같은 알라딘 출처라도: 검색은 **쿼리 문자열 + 상위 N건**이라 제목/부제/기호 차이로 1번 검색에 안 잡힐 수 있음.
 * → 품번 검색 + 제목 변형 + 저자 결합 검색을 순차 시도하고, 수집된 결과에서 ID/제목/저자로 매칭합니다.
 *
 * @param aladinItemId 랭킹 API의 bookId(알라딘 itemId)
 * @param titleOrQuery 도서 제목(랭킹과 동일 출처)
 * @param rankingAuthors 랭킹의 authors 문자열(선택, 매칭 정확도 향상)
 */
export async function hydrateBookForDetailViaSearch(
  aladinItemId: string,
  titleOrQuery: string,
  rankingAuthors?: string,
): Promise<string> {
  const title = titleOrQuery.trim();
  if (!title) {
    throw new Error('검색어(도서 제목)가 없습니다.');
  }

  const queries = buildRankingSearchQueries(title, aladinItemId, rankingAuthors);
  const merged: SearchBookItem[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    try {
      const { data } = await searchBooks(q);
      for (const it of data.items ?? []) {
        const id = it.aladin_item_id;
        if (id && !seen.has(id)) {
          seen.add(id);
          merged.push(it);
        }
      }
      const quick = pickSearchItemForRanking(data.items ?? [], aladinItemId, title, rankingAuthors);
      if (quick) {
        await getBookDetail(quick.aladin_item_id, true);
        return quick.aladin_item_id;
      }
    } catch {
      // 개별 쿼리 실패 시 다음 후보
    }
  }

  const matched = pickSearchItemForRanking(merged, aladinItemId, title, rankingAuthors);
  if (!matched) {
    throw new Error('검색 결과에서 해당 도서를 찾지 못했습니다.');
  }

  await getBookDetail(matched.aladin_item_id, true);
  return matched.aladin_item_id;
}

/**
 * 최근 검색어 조회
 */
export const getRecentQueries = () =>
  apiClient.get<RecentQueriesResponse>('/api/search/recent');

/**
 * 최근 검색어 1개 삭제
 * @param query 삭제할 검색어
 */
export const deleteRecentQuery = (query: string) =>
  apiClient.delete<void>('/api/search/recent', {
    params: { query },
  });

/**
 * 최근 검색어 전체 삭제
 */
export const clearRecentQueries = () =>
  apiClient.delete<void>('/api/search/recent');

/**
 * 최근 본 책 조회
 */
export const getRecentBooks = () =>
  apiClient.get<RecentBooksResponse>('/api/search/recent-books');

/**
 * 최근 본 책 1개 삭제
 * @param bookId 책 UUID
 */
export const deleteRecentBook = (bookId: string) =>
  apiClient.delete<void>(`/api/search/recent-books/${bookId}`);

/**
 * 최근 본 책 전체 삭제
 */
export const clearRecentBooks = () =>
  apiClient.delete<void>('/api/search/recent-books');

