// src/api/reading.ts

import { getAccessToken } from '@/src/services/auth/authService';
import type { BookshelfItem, BookshelfResponse, CurrentReadingItem, CurrentReadingResponse } from '@/src/types/reading';

const READING_API_BASE_URL = 'https://daedokdan-api.onrender.com';

/**
 * Authorization 헤더 가져오기
 */
async function getAuthHeader(): Promise<string> {
  const token = await getAccessToken();
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

    const url = `${READING_API_BASE_URL}/api/reading/current`;
    console.log('[Reading API] Request URL:', url);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    console.log('[Reading API] Response status:', res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('[Reading API] 현재 읽는 책 조회 실패:', {
        status: res.status,
        statusText: res.statusText,
        errorText,
        headers: Object.fromEntries(res.headers.entries()),
      });
      throw new Error(
        `현재 읽는 책 목록을 불러오는데 실패했습니다. (${res.status}: ${errorText || res.statusText})`,
      );
    }

    const data: CurrentReadingResponse = await res.json();
    console.log('[Reading API] Response data:', JSON.stringify(data, null, 2));
    return data.items || [];
  } catch (error: any) {
    console.error('[Reading API] fetchCurrentReadingBooks error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    // 원본 에러 메시지가 있으면 그대로 전달
    if (error?.message) {
      throw error;
    }
    throw new Error('현재 읽는 책 목록을 불러오는데 실패했습니다.');
  }
}

/**
 * 내 서재(책장) 조회
 * GET /api/reading/bookshelf
 */
export async function fetchBookshelf(): Promise<BookshelfItem[]> {
  try {
    const authHeader = await getAuthHeader();

    const url = `${READING_API_BASE_URL}/api/reading/bookshelf`;
    console.log('[Reading API] Request URL:', url);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    console.log('[Reading API] Response status:', res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('[Reading API] 책장 조회 실패:', {
        status: res.status,
        statusText: res.statusText,
        errorText,
        headers: Object.fromEntries(res.headers.entries()),
      });
      throw new Error(
        `책장 목록을 불러오는데 실패했습니다. (${res.status}: ${errorText || res.statusText})`,
      );
    }

    const data: BookshelfResponse = await res.json();
    console.log('[Reading API] Response data:', JSON.stringify(data, null, 2));
    // reading과 planned 목록을 합쳐서 반환
    return [...(data.reading || []), ...(data.planned || [])];
  } catch (error: any) {
    console.error('[Reading API] fetchBookshelf error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    // 원본 에러 메시지가 있으면 그대로 전달
    if (error?.message) {
      throw error;
    }
    throw new Error('책장 목록을 불러오는데 실패했습니다.');
  }
}

