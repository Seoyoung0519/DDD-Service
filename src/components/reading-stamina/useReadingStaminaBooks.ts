import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchBooksByPageRange, STAMINA_BY_PAGES_MAX_LIMIT } from '@/src/api/readingStamina';
import type { ReadingStaminaBook, ReadingStaminaRangeKey } from '@/src/components/reading-stamina/types';

/** 메인 캐러셀(상위 5권)용 — 최소 fetch */
export const STAMINA_CAROUSEL_FETCH_LIMIT = 10;
/** 상세 그리드 — API limit 상한(서버가 가진 전체) */
export const STAMINA_DETAIL_FETCH_LIMIT = STAMINA_BY_PAGES_MAX_LIMIT;

export function useReadingStaminaBooks(
  initialRange: ReadingStaminaRangeKey = '100',
  options: { limit?: number } = {},
) {
  const fetchLimit = options.limit;
  const [range, setRange] = useState<ReadingStaminaRangeKey>(initialRange);
  const [books, setBooks] = useState<ReadingStaminaBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRange(initialRange);
  }, [initialRange]);

  const load = useCallback(async (nextRange: ReadingStaminaRangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchBooksByPageRange(nextRange, {
        limit: fetchLimit ?? STAMINA_BY_PAGES_MAX_LIMIT,
      });
      setBooks(list);
    } catch (e: unknown) {
      setBooks([]);
      setError(
        e instanceof Error ? e.message : '독서체력 추천 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [fetchLimit]);

  useEffect(() => {
    void load(range);
  }, [range, load]);

  const changeRange = useCallback((next: ReadingStaminaRangeKey) => {
    setRange(next);
  }, []);

  const topFive = useMemo(() => books.slice(0, 5), [books]);

  return {
    range,
    setRange: changeRange,
    books,
    topFive,
    loading,
    error,
    reload: () => void load(range),
  };
}
