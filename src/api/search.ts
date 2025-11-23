import { apiClient } from './client';

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

