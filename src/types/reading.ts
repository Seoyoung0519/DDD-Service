// src/types/reading.ts

export type CurrentReadingItem = {
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
};

export type BookshelfItem = CurrentReadingItem & {
  status: 'reading' | 'planned' | 'completed' | 'dropped';
  completedAt: string | null;
  startedAt: string | null;
};

export type CurrentReadingResponse = {
  items: CurrentReadingItem[];
};

export type BookshelfResponse = {
  reading: BookshelfItem[];
  planned: BookshelfItem[];
  completed: BookshelfItem[];
  dropped: BookshelfItem[];
};

