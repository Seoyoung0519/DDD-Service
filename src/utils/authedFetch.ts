// src/utils/authedFetch.ts

import { MAIN_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';
import { logError } from '@/src/utils/appLog';

export async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await getMainApiAccessToken();
  if (!token) throw new Error('로그인 필요');

  const res = await fetch(`${MAIN_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    logError('API', `요청 실패 status=${res.status}`);
    throw new Error('API 요청 실패');
  }

  return res.json();
}

