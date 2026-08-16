// src/api/reading.ts

import { MAIN_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';
import type { BookshelfItem, BookshelfResponse, CurrentReadingItem, CurrentReadingResponse } from '@/src/types/reading';
import { logError, logStatus } from '@/src/utils/appLog';

/**
 * Authorization 헤더 가져오기
 */
async function getAuthHeader(): Promise<string> {
  const token = await getMainApiAccessToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }
  return `Bearer ${token}`;
}

/**
 * 현재 읽는 책 목록 조회
 * GET /api/reading/current
 */
export async function fetchCurrentReadingBooks(): Promise<CurrentReadingItem[]> {
  try {
    const authHeader = await getAuthHeader();
    const url = `${MAIN_API_BASE_URL}/api/reading/current`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      logError('Reading API', `현재 읽는 책 조회 실패 status=${res.status}`);
      throw new Error('현재 읽는 책 목록을 불러오는데 실패했습니다.');
    }

    const data: CurrentReadingResponse = await res.json();
    logStatus('Reading API', `현재 읽는 책 ${data.items?.length ?? 0}권`);
    return data.items || [];
  } catch (error: any) {
    logError('Reading API', '현재 읽는 책 조회 실패');
    if (error?.message) {
      throw error;
    }
    throw new Error('현재 읽는 책 목록을 불러오는데 실패했습니다.');
  }
}

/**
 * 내 서재 전체 조회 (planned·reading·completed·dropped)
 * GET /api/reading/bookshelf
 */
export async function fetchBookshelfResponse(): Promise<BookshelfResponse> {
  try {
    const authHeader = await getAuthHeader();
    const url = `${MAIN_API_BASE_URL}/api/reading/bookshelf`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      logError('Reading API', `책장 조회 실패 status=${res.status}`);
      throw new Error('책장 목록을 불러오는데 실패했습니다.');
    }

    const data: BookshelfResponse = await res.json();
    logStatus('Reading API', '책장 조회 완료');
    return data;
  } catch (error: any) {
    logError('Reading API', '책장 조회 실패');
    if (error?.message) {
      throw error;
    }
    throw new Error('책장 목록을 불러오는데 실패했습니다.');
  }
}

/**
 * 독서 세션 — 「책장에서 불러오기」용 목록.
 * 읽기 전에 담아둔 책(planned)만 반환. 진행 중 책은 ReadingSession_2에서 별도 조회.
 * (서랍장 Drawer_1은 getBookshelfList()를 사용하며 이 함수와 무관)
 */
export async function fetchPlannedBooksForReadingSession(): Promise<BookshelfItem[]> {
  const data = await fetchBookshelfResponse();
  return data.planned || [];
}
