// src/utils/authedFetch.ts

import { API_BASE_URL } from '@/src/config/api';
import { getAccessToken } from '@/src/services/auth/authService';

export async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('로그인 필요');

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[API] Error:', res.status, text);
    throw new Error('API 요청 실패');
  }

  return res.json();
}

