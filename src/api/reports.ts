import { MAIN_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';
import { adminRequest } from '@/src/api/adminApi';

export type ReportTargetType = 'review' | 'comment' | 'user';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export type Report = {
  id: string;
  reporter_user_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  admin_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateReportInput = {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  description?: string | null;
};

export type CreateAdminReportInput = CreateReportInput & {
  reporter_user_id: string;
};

export type UpdateAdminReportInput = {
  status?: ReportStatus;
  admin_note?: string | null;
};

type ReportEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export class ReportApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ReportApiError';
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

function getMessage(body: unknown): string {
  if (typeof body === 'string') return body.trim();
  if (!body || typeof body !== 'object') return '';
  const value = body as Record<string, unknown>;
  if (typeof value.message === 'string') return value.message.trim();
  if (typeof value.error === 'string') return value.error.trim();
  return '';
}

function fallbackMessage(status: number): string {
  if (status === 400) return '신고 내용을 확인해 주세요.';
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  if (status === 403) return '관리자 권한이 없습니다.';
  if (status === 404) return '신고 내역을 찾을 수 없습니다.';
  if (status === 429) return '신고 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  return `신고 요청에 실패했습니다. (HTTP ${status})`;
}

async function reportRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getMainApiAccessToken();
  if (!token) throw new ReportApiError('로그인이 필요합니다.', 401);

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
    throw new ReportApiError(
      timedOut ? '신고 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.' : '네트워크 연결을 확인해 주세요.',
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = parseBody(await response.text().catch(() => ''));
  if (!response.ok) {
    throw new ReportApiError(getMessage(body) || fallbackMessage(response.status), response.status);
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as ReportEnvelope<T>;
    if (!envelope.success) {
      throw new ReportApiError(envelope.message || '신고 요청에 실패했습니다.', response.status);
    }
    return envelope.data as T;
  }
  return body as T;
}

export function createReport(input: CreateReportInput): Promise<Report> {
  return reportRequest<Report>('/api/reports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchAdminReports(status?: ReportStatus): Promise<Report[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminRequest<Report[]>(`/api/admin/reports${query}`);
}

export function fetchAdminReport(id: string): Promise<Report> {
  return adminRequest<Report>(`/api/admin/reports/${encodeURIComponent(id)}`);
}

export function createAdminReport(input: CreateAdminReportInput): Promise<Report> {
  return adminRequest<Report>('/api/admin/reports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminReport(
  id: string,
  input: UpdateAdminReportInput,
): Promise<Report> {
  return adminRequest<Report>(`/api/admin/reports/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminReport(id: string): Promise<void> {
  await adminRequest<void>(`/api/admin/reports/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
