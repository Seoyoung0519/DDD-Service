import { apiClient } from './client';

// ==================== 타입 정의 ====================

export interface BookshelfItem {
  userBookId: string;
  bookId: string;
  title: string;
  authors: string[] | string | null;
  coverUrl: string | null;
  startPage: number | null;
  currentPage: number;
  endPage: number | null;
  pageCount: number | null;
  progress: number;
  status: 'planned' | 'reading' | 'completed' | 'dropped';
  completedAt: string | null;
  startedAt: string | null;
}

export interface AddToBookshelfResponse {
  item: BookshelfItem;
  alreadyExists: boolean;
}

export interface BookshelfListResponse {
  reading: BookshelfItem[];
  planned: BookshelfItem[];
  completed: BookshelfItem[];
  dropped: BookshelfItem[];
}

// ==================== API 함수들 ====================

/**
 * 내 서재에 책 추가
 * @param bookId 우리 DB의 books.id (uuid)
 * ⚠️ body 필드명은 반드시 snake_case "book_id" 사용
 */
export const addBookToBookshelf = (bookId: string) =>
  apiClient.post<AddToBookshelfResponse>('/api/reading/bookshelf', {
    book_id: bookId,
  });

/**
 * @deprecated addBookToBookshelf를 사용하세요
 */
export const addToBookshelf = addBookToBookshelf;

/**
 * 내 서재 목록 조회
 */
export const getBookshelfList = () =>
  apiClient.get<BookshelfListResponse>('/api/reading/bookshelf');

/**
 * 내 서재에서 책 삭제
 * @param userBookId user_books 테이블의 id (uuid)
 */
export const removeFromBookshelf = (userBookId: string) =>
  apiClient.delete<void>(`/api/reading/bookshelf/${userBookId}`);

