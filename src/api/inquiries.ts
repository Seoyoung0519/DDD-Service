import { MAIN_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';
import { adminRequest } from '@/src/api/adminApi';

export type InquiryStatus = 'open' | 'answered' | 'closed';

export type Inquiry = {
  id: string;
  user_id: string;
  subject: string;
  content: string;
  status: InquiryStatus;
  admin_reply: string | null;
  replied_at: string | null;
  replied_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateInquiryInput = {
  subject: string;
  content: string;
};

export type CreateAdminInquiryInput = CreateInquiryInput & {
  user_id: string;
};

export type UpdateAdminInquiryInput = {
  admin_reply?: string | null;
  status?: InquiryStatus;
  subject?: string;
  content?: string;
};

type InquiryEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export class InquiryApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'InquiryApiError';
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
  if (status === 400) return '문의 내용을 확인해 주세요.';
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  if (status === 403) return '관리자 권한이 없습니다.';
  if (status === 404) return '문의 내역을 찾을 수 없습니다.';
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  return `문의 요청에 실패했습니다. (HTTP ${status})`;
}

async function inquiryRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getMainApiAccessToken();
  if (!token) throw new InquiryApiError('로그인이 필요합니다.', 401);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };
  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) headers['x-api-key'] = apiKey;
  if (options.body != null) headers['Content-Type'] = 'application/json';

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
    throw new InquiryApiError(
      timedOut
        ? '문의 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
        : '네트워크 연결을 확인해 주세요.',
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = parseBody(await response.text().catch(() => ''));
  if (!response.ok) {
    throw new InquiryApiError(
      responseMessage(body) || fallbackMessage(response.status),
      response.status,
    );
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as InquiryEnvelope<T>;
    if (!envelope.success) {
      throw new InquiryApiError(
        envelope.message || '문의 요청에 실패했습니다.',
        response.status,
      );
    }
    return envelope.data as T;
  }
  return body as T;
}

export function createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
  return inquiryRequest<Inquiry>('/api/inquiries', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchMyInquiries(): Promise<Inquiry[]> {
  return inquiryRequest<Inquiry[]>('/api/inquiries/me');
}

export function fetchMyInquiry(id: string): Promise<Inquiry> {
  return inquiryRequest<Inquiry>(`/api/inquiries/me/${encodeURIComponent(id)}`);
}

export function fetchAdminInquiries(status?: InquiryStatus): Promise<Inquiry[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminRequest<Inquiry[]>(`/api/admin/inquiries${query}`);
}

export function fetchAdminInquiry(id: string): Promise<Inquiry> {
  return adminRequest<Inquiry>(`/api/admin/inquiries/${encodeURIComponent(id)}`);
}

export function createAdminInquiry(input: CreateAdminInquiryInput): Promise<Inquiry> {
  return adminRequest<Inquiry>('/api/admin/inquiries', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminInquiry(
  id: string,
  input: UpdateAdminInquiryInput,
): Promise<Inquiry> {
  return adminRequest<Inquiry>(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminInquiry(id: string): Promise<void> {
  await adminRequest<void>(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
