import { ADMIN_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  detail?: string;
};

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

function parseBody(text: string): unknown {
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
  const value = body as Record<string, unknown>;
  return [value.message, value.error, value.detail]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join('\n');
}

function fallbackMessage(status: number): string {
  if (status === 400) return '입력 내용을 확인해 주세요.';
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  if (status === 403) return '관리자 권한이 없습니다.';
  if (status === 404) return '요청한 관리 항목을 찾을 수 없습니다.';
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  return `관리자 API 요청에 실패했습니다. (HTTP ${status})`;
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getMainApiAccessToken();
  if (!token) throw new AdminApiError('로그인이 필요합니다.', 401);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };
  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) headers['x-api-key'] = apiKey;
  if (options.body != null) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let response: Response;
  try {
    response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (reason) {
    const timedOut = reason instanceof Error && reason.name === 'AbortError';
    throw new AdminApiError(
      timedOut
        ? '관리자 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
        : '네트워크 연결을 확인해 주세요.',
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = parseBody(await response.text().catch(() => ''));
  if (!response.ok) {
    throw new AdminApiError(
      readMessage(body) || fallbackMessage(response.status),
      response.status,
    );
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as ApiEnvelope<T>;
    if (envelope.success !== true) {
      throw new AdminApiError(
        readMessage(envelope) || '관리자 API 요청에 실패했습니다.',
        response.status,
      );
    }
    if (envelope.data === undefined) {
      if (options.method === 'DELETE') return undefined as T;
      throw new AdminApiError('서버 응답에 필요한 data가 없습니다.', response.status);
    }
    return envelope.data;
  }

  return body as T;
}
