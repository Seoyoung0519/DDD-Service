import { MAIN_API_BASE_URL } from '@/src/config/api';
import { getDaedokdanApiAuthHeaders } from '@/src/api/readingSession';

export type SavePushTokenRequest = {
  userId: string;
  token: string;
};

export type SavePushTokenResponse = {
  message: string;
};

/**
 * FCM 토큰 저장 — POST /api/push/token
 * @see 푸시 알림 API 개발 설명서 4-1
 */
export async function savePushToken(payload: SavePushTokenRequest): Promise<SavePushTokenResponse> {
  const headers = await getDaedokdanApiAuthHeaders();
  const url = `${MAIN_API_BASE_URL}/api/push/token`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userId: payload.userId,
      token: payload.token,
    }),
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    let msg = raw;
    try {
      const j = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      if (typeof j.message === 'string') msg = j.message;
      else if (typeof j.error === 'string') msg = j.error;
    } catch {
      /* raw 사용 */
    }
    throw new Error(msg.trim() || `FCM 토큰 저장에 실패했습니다. (${res.status})`);
  }

  try {
    return (raw ? JSON.parse(raw) : { message: 'FCM token saved successfully' }) as SavePushTokenResponse;
  } catch {
    return { message: 'FCM token saved successfully' };
  }
}
