import { MAIN_API_BASE_URL } from '@/src/config/api';

export interface RankingBookItem {
  rank: number;
  bookId: string;
  title: string;
  authors: string;
  coverUrl: string;
}

export interface RankingBooksResponse {
  success: boolean;
  data: {
    rankings: RankingBookItem[];
  };
  error: string | null;
}

/**
 * 대독랭킹(알라딘 베스트셀러 기반) - 공개 데이터
 * GET /api/ranking/books
 */
export async function fetchRankingBooks(): Promise<RankingBookItem[]> {
  const url = `${MAIN_API_BASE_URL}/api/ranking/books`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `랭킹 조회 실패 (status: ${res.status})`);
  }

  const body = (await res.json()) as RankingBooksResponse;
  return body?.data?.rankings ?? [];
}

