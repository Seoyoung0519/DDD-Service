import { BANNER_API_BASE_URL } from '@/src/config/api';
import { getMainApiAccessToken } from '@/src/services/auth/authService';
import { adminRequest } from '@/src/api/adminApi';

export type Banner = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateBannerInput = {
  title: string;
  image_url: string;
  link_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type UpdateBannerInput = Partial<CreateBannerInput>;

type BannerApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export class BannerApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'BannerApiError';
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

function responseMessage(body: unknown): string {
  if (typeof body === 'string') return body.trim();
  if (!body || typeof body !== 'object') return '';
  const record = body as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message.trim();
  if (typeof record.error === 'string') return record.error.trim();
  if (typeof record.detail === 'string') return record.detail.trim();
  return '';
}

function statusMessage(status: number): string {
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  if (status === 403) return '관리자 권한이 없습니다.';
  if (status === 404) return '배너를 찾을 수 없습니다.';
  return `배너 요청에 실패했습니다. (HTTP ${status})`;
}

async function requestBannerApi<T>(
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

  if (options.body != null) {
    headers['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    const token = await getMainApiAccessToken();
    if (!token) {
      throw new BannerApiError('로그인이 필요합니다.', 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BANNER_API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    throw new BannerApiError(detail || '네트워크 연결을 확인해 주세요.', 0);
  }

  const text = await response.text().catch(() => '');
  const body = parseJson(text);

  if (!response.ok) {
    throw new BannerApiError(responseMessage(body) || statusMessage(response.status), response.status);
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as BannerApiEnvelope<T>;
    if (envelope.success !== true) {
      throw new BannerApiError(envelope.message || '배너 요청에 실패했습니다.', response.status);
    }
    if (envelope.data === undefined) {
      return undefined as T;
    }
    return envelope.data;
  }

  return body as T;
}

/** 앱 홈에 현재 노출 가능한 활성 배너만 조회합니다. */
export async function fetchBanners(): Promise<Banner[]> {
  try {
    return await requestBannerApi<Banner[]>('/api/banners');
  } catch (error) {
    // 명세상 공개 API지만 현재 배포 서버가 Authorization을 요구하는 경우 로그인 JWT로 재시도합니다.
    if (error instanceof BannerApiError && error.status === 401) {
      return requestBannerApi<Banner[]>('/api/banners', {}, true);
    }
    throw error;
  }
}

export function fetchBanner(id: string): Promise<Banner> {
  return requestBannerApi<Banner>(`/api/banners/${encodeURIComponent(id)}`);
}

export function fetchAdminBanners(): Promise<Banner[]> {
  return adminRequest<Banner[]>('/api/admin/banners');
}

export function fetchAdminBanner(id: string): Promise<Banner> {
  return adminRequest<Banner>(`/api/admin/banners/${encodeURIComponent(id)}`);
}

export function createAdminBanner(input: CreateBannerInput): Promise<Banner> {
  return adminRequest<Banner>(
    '/api/admin/banners',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function updateAdminBanner(id: string, input: UpdateBannerInput): Promise<Banner> {
  return adminRequest<Banner>(
    `/api/admin/banners/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteAdminBanner(id: string): Promise<void> {
  await adminRequest<void>(
    `/api/admin/banners/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
