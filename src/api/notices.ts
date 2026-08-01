import { MAIN_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';
import { adminRequest } from '@/src/api/adminApi';

export type Notice = {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateNoticeInput = {
  title: string;
  content?: string;
  is_published?: boolean;
  published_at?: string | null;
};

export type UpdateNoticeInput = Partial<CreateNoticeInput>;

type NoticeEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export class NoticeApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'NoticeApiError';
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

function responseMessage(body: unknown): string {
  if (typeof body === 'string') return body.trim();
  if (!body || typeof body !== 'object') return '';
  const value = body as Record<string, unknown>;
  if (typeof value.message === 'string') return value.message.trim();
  if (typeof value.error === 'string') return value.error.trim();
  return '';
}

function fallbackMessage(status: number): string {
  if (status === 400) return '공지 내용을 확인해 주세요.';
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  if (status === 403) return '관리자 권한이 없습니다.';
  if (status === 404) return '공지사항을 찾을 수 없습니다.';
  return `공지사항 요청에 실패했습니다. (HTTP ${status})`;
}

async function noticeRequest<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) headers['x-api-key'] = apiKey;
  if (options.body != null) headers['Content-Type'] = 'application/json';
  if (requiresAuth) {
    const token = await getMainApiAccessToken();
    if (!token) throw new NoticeApiError('로그인이 필요합니다.', 401);
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(`${MAIN_API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (reason) {
    const timedOut = reason instanceof Error && reason.name === 'AbortError';
    throw new NoticeApiError(
      timedOut
        ? '공지 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
        : '네트워크 연결을 확인해 주세요.',
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = parseBody(await response.text().catch(() => ''));
  if (!response.ok) {
    throw new NoticeApiError(
      responseMessage(body) || fallbackMessage(response.status),
      response.status,
    );
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as NoticeEnvelope<T>;
    if (!envelope.success) {
      throw new NoticeApiError(envelope.message || '공지사항 요청에 실패했습니다.', response.status);
    }
    return envelope.data as T;
  }
  return body as T;
}

export async function fetchNotices(): Promise<Notice[]> {
  try {
    return await noticeRequest<Notice[]>('/api/notices');
  } catch (error) {
    // 명세상 공개 API지만 배포 서버가 인증을 요구하는 경우 로그인 JWT로 재시도합니다.
    if (error instanceof NoticeApiError && error.status === 401) {
      return noticeRequest<Notice[]>('/api/notices', {}, true);
    }
    throw error;
  }
}

export async function fetchNotice(id: string): Promise<Notice> {
  const path = `/api/notices/${encodeURIComponent(id)}`;
  try {
    return await noticeRequest<Notice>(path);
  } catch (error) {
    if (error instanceof NoticeApiError && error.status === 401) {
      return noticeRequest<Notice>(path, {}, true);
    }
    throw error;
  }
}

export function fetchAdminNotices(): Promise<Notice[]> {
  return adminRequest<Notice[]>('/api/admin/notices');
}

export function fetchAdminNotice(id: string): Promise<Notice> {
  return adminRequest<Notice>(`/api/admin/notices/${encodeURIComponent(id)}`);
}

export function createAdminNotice(input: CreateNoticeInput): Promise<Notice> {
  return adminRequest<Notice>(
    '/api/admin/notices',
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function updateAdminNotice(id: string, input: UpdateNoticeInput): Promise<Notice> {
  return adminRequest<Notice>(
    `/api/admin/notices/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
}

export async function deleteAdminNotice(id: string): Promise<void> {
  await adminRequest<void>(
    `/api/admin/notices/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
