import { MAIN_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';

type ContentEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export class ContentApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ContentApiError';
    this.status = status;
  }
}

function parseJson(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function readMessage(body: unknown): string {
  if (typeof body === 'string') return body.trim();
  if (!body || typeof body !== 'object') return '';
  const record = body as Record<string, unknown>;
  for (const key of ['message', 'error', 'detail'] as const) {
    if (typeof record[key] === 'string' && record[key].trim()) return record[key].trim();
  }
  return '';
}

/**
 * 공개 콘텐츠 API (`/api/picks`, `/api/events`, `/api/dictionary`)
 * JWT 불필요. 배포에 따라 401이면 Bearer로 재시도합니다.
 */
export async function contentRequest<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) headers['x-api-key'] = apiKey;
  if (options.body != null) headers['Content-Type'] = 'application/json';

  if (authenticated) {
    const token = await getMainApiAccessToken();
    if (!token) throw new ContentApiError('로그인이 필요합니다.', 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${MAIN_API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new ContentApiError(
      error instanceof Error ? error.message : '네트워크 연결을 확인해 주세요.',
      0,
    );
  }

  const text = await response.text().catch(() => '');
  const body = parseJson(text);

  if (!response.ok) {
    throw new ContentApiError(
      readMessage(body) || `요청에 실패했습니다. (HTTP ${response.status})`,
      response.status,
    );
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as ContentEnvelope<T>;
    if (envelope.success !== true) {
      throw new ContentApiError(readMessage(envelope) || '요청에 실패했습니다.', response.status);
    }
    if (envelope.data === undefined) {
      return undefined as T;
    }
    return envelope.data;
  }

  return body as T;
}

export async function publicContentRequest<T>(path: string): Promise<T> {
  try {
    return await contentRequest<T>(path);
  } catch (error) {
    if (error instanceof ContentApiError && error.status === 401) {
      return contentRequest<T>(path, {}, true);
    }
    throw error;
  }
}
