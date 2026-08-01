import { SETTINGS_API_BASE_URL } from '@/src/config/api';
import {
  getCachedUserId,
  getMainApiAccessToken,
} from '@/src/services/auth/authService';

const SETTINGS_REQUEST_TIMEOUT_MS = 20000;

export type SettingsPlatform = 'android' | 'ios' | 'web';
export type PolicyType = 'terms' | 'privacy' | 'location';

export type DeleteAccountInput = {
  reason?: string;
  confirmText: '탈퇴';
};

export type DeleteAccountResponse = {
  ok: true;
  deletedAt: string;
};

export type AppVersionResponse = {
  platform: SettingsPlatform;
  latestVersion: string;
  minimumVersion: string;
  forceUpdate: boolean;
  updateUrl: string;
};

export type Agreement = {
  userId: string;
  termsVersion: string;
  privacyVersion: string;
  locationTermsVersion: string;
  marketingConsent: boolean;
  agreedAt: string;
  device: SettingsPlatform;
  appVersion: string;
};

export type SubmitAgreementInput = {
  termsVersion: string;
  privacyVersion: string;
  locationTermsVersion: string;
  marketingConsent: boolean;
  device: SettingsPlatform;
  appVersion: string;
};

export type PolicyDocument = {
  type: PolicyType;
  version: string;
  title: string;
  contentUrl: string | null;
  content: string | null;
  effectiveDate: string;
};

export type Notice = {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
};

type NoticesResponse = {
  items: Notice[];
};

export class SettingsApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'SettingsApiError';
    this.status = status;
  }
}

function parseResponseBody(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(body: unknown): string {
  if (typeof body === 'string') return body.trim();
  if (!body || typeof body !== 'object') return '';
  const record = body as Record<string, unknown>;
  for (const key of ['message', 'error', 'detail'] as const) {
    if (typeof record[key] === 'string' && record[key].trim()) return record[key].trim();
  }
  return '';
}

type SettingsEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  detail?: string;
};

function unwrapSettingsPayload<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as SettingsEnvelope<T>;
    if (envelope.success === false) {
      throw new SettingsApiError(
        extractErrorMessage(envelope) || '설정 요청에 실패했습니다.',
        400,
      );
    }
    if (envelope.data !== undefined) return envelope.data;
  }
  return body as T;
}

function isPolicyDocument(value: unknown): value is PolicyDocument {
  if (!value || typeof value !== 'object') return false;
  const record = value as PolicyDocument;
  return (
    typeof record.version === 'string' &&
    typeof record.type === 'string' &&
    typeof record.title === 'string'
  );
}

export function normalizePolicyDocuments(value: unknown): PolicyDocument[] {
  if (Array.isArray(value)) {
    return value.filter(isPolicyDocument);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['items', 'policies', 'results', 'data'] as const) {
      if (key in record) {
        return normalizePolicyDocuments(record[key]);
      }
    }
  }
  return [];
}

function isMissingAgreementHistoryError(error: unknown): boolean {
  if (!(error instanceof SettingsApiError)) return false;
  if (error.status === 404) return true;
  return error.message.includes('이력') || error.message.includes('동의 이력');
}

function defaultStatusMessage(status: number): string {
  if (status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  if (status === 403) return '이 기능을 사용할 권한이 없습니다.';
  if (status === 404) return '요청한 정보를 찾을 수 없습니다.';
  return `설정 요청에 실패했습니다. (HTTP ${status})`;
}

async function settingsRequest<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SETTINGS_REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (options.body != null) headers['Content-Type'] = 'application/json';

    const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;

    const userId = await getCachedUserId();
    if (userId) headers['x-user-id'] = userId;

    if (authenticated) {
      const token = await getMainApiAccessToken();
      if (!token) throw new SettingsApiError('로그인이 필요합니다.', 401);
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${SETTINGS_API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    const text = await response.text().catch(() => '');
    const body = parseResponseBody(text);

    if (!response.ok) {
      throw new SettingsApiError(
        extractErrorMessage(body) || defaultStatusMessage(response.status),
        response.status,
      );
    }

    return unwrapSettingsPayload<T>(body);
  } catch (error) {
    if (error instanceof SettingsApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SettingsApiError(
        '요청 시간이 초과되었습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
        0,
      );
    }
    throw new SettingsApiError(
      error instanceof Error ? error.message : '네트워크 연결을 확인해 주세요.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

async function publicSettingsRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    return await settingsRequest<T>(path, options, false);
  } catch (error) {
    // 공개 명세와 달리 배포 서버가 전역 인증을 요구하는 경우 로그인 토큰으로 재시도합니다.
    if (error instanceof SettingsApiError && error.status === 401) {
      return settingsRequest<T>(path, options, true);
    }
    throw error;
  }
}

export function deleteAccount(input: DeleteAccountInput): Promise<DeleteAccountResponse> {
  return settingsRequest<DeleteAccountResponse>('/settings/account', {
    method: 'DELETE',
    body: JSON.stringify(input),
  });
}

export function fetchAppVersion(platform: SettingsPlatform): Promise<AppVersionResponse> {
  return publicSettingsRequest<AppVersionResponse>(
    `/settings/version?platform=${encodeURIComponent(platform)}`,
  );
}

export function fetchAgreements(): Promise<Agreement> {
  return settingsRequest<Agreement>('/agreements');
}

export function submitAgreements(input: SubmitAgreementInput): Promise<Agreement> {
  return settingsRequest<Agreement>('/agreements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMarketingAgreement(marketingConsent: boolean): Promise<Agreement> {
  return settingsRequest<Agreement>('/agreements/marketing', {
    method: 'PATCH',
    body: JSON.stringify({ marketingConsent }),
  });
}

export type AgreementVersionInput = Pick<
  SubmitAgreementInput,
  'termsVersion' | 'privacyVersion' | 'locationTermsVersion'
>;

/** PATCH 실패(동의 이력 없음 등) 시 POST로 마케팅·필수 약관 동의를 함께 저장합니다. */
export async function saveMarketingConsent(
  marketingConsent: boolean,
  versions: AgreementVersionInput,
  meta: Pick<SubmitAgreementInput, 'device' | 'appVersion'>,
  options?: { tryPatchFirst?: boolean },
): Promise<Agreement> {
  const tryPatchFirst = options?.tryPatchFirst ?? true;

  if (tryPatchFirst) {
    try {
      return await updateMarketingAgreement(marketingConsent);
    } catch (error) {
      if (!isMissingAgreementHistoryError(error)) throw error;
    }
  }

  return submitAgreements({
    ...versions,
    marketingConsent,
    ...meta,
  });
}

export async function fetchPolicies(type: PolicyType): Promise<PolicyDocument[]> {
  const body = await publicSettingsRequest<unknown>(
    `/agreements/policies?type=${encodeURIComponent(type)}`,
  );
  return normalizePolicyDocuments(body);
}

export async function fetchNotices(options?: {
  category?: string;
  limit?: number;
}): Promise<Notice[]> {
  const params = new URLSearchParams();
  if (options?.category) params.set('category', options.category);
  params.set('limit', String(options?.limit ?? 50));
  const response = await publicSettingsRequest<NoticesResponse>(
    `/notices?${params.toString()}`,
  );
  return Array.isArray(response.items) ? response.items : [];
}

export function fetchNotice(noticeId: string): Promise<Notice> {
  return publicSettingsRequest<Notice>(
    `/notices/${encodeURIComponent(noticeId)}`,
  );
}
