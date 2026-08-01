/**
 * 독서체력 — GET `/api/books/by-pages?range=` (MAIN_API_BASE_URL, Bearer 필수)
 */
import { apiClient } from '@/src/api/client';
import type { ReadingStaminaBook, ReadingStaminaRangeKey } from '@/src/components/reading-stamina/types';
import { RANGE_TO_API_PARAM, formatStaminaAuthor, normalizeStaminaBook } from '@/src/components/reading-stamina/types';

type BooksByPagesResponse = {
  success?: boolean;
  data?: {
    books?: unknown[];
    range?: string;
  };
  error?: string | null;
};

export type FetchBooksByPageRangeOptions = {
  /** API `limit` — 미전달 시 서버 기본 10권만 반환 */
  limit?: number;
};

/** `GET /api/books/by-pages` — 서버 카탈로그 전체를 받기 위한 limit 상한 */
export const STAMINA_BY_PAGES_MAX_LIMIT = 1000;

export async function fetchBooksByPageRange(
  rangeKey: ReadingStaminaRangeKey,
  options: FetchBooksByPageRangeOptions = {},
): Promise<ReadingStaminaBook[]> {
  const range = RANGE_TO_API_PARAM[rangeKey];
  const res = await apiClient.get<BooksByPagesResponse>('/api/books/by-pages', {
    params: {
      range,
      limit: options.limit ?? STAMINA_BY_PAGES_MAX_LIMIT,
    },
  });

  const raw = res.data?.data?.books ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map(normalizeStaminaBook)
    .filter((b): b is ReadingStaminaBook => b != null);
}

export { formatStaminaAuthor };
