import { LOGIN_API_BASE_URL } from '@/src/config/api';
import {
  getAccessToken,
  getCachedUserId,
  getExtendedAccessToken,
  getGoogleIdToken,
  saveExtendedAccessToken,
} from '@/src/services/auth/authService';

export function isInvalidTokenDetail(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  try {
    const j = JSON.parse(t) as { detail?: string | string[] };
    const d = j?.detail;
    if (typeof d === 'string' && /invalid token/i.test(d)) return true;
    if (Array.isArray(d) && d.some((x) => typeof x === 'string' && /invalid token/i.test(x))) {
      return true;
    }
  } catch {
    if (/invalid token/i.test(t)) return true;
  }
  return false;
}

export function parseApiErrorDetail(text: string): string {
  const t = text.trim();
  if (!t) return '';
  try {
    const j = JSON.parse(t) as { detail?: unknown; message?: string };
    if (typeof j.message === 'string') return j.message;
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join('\n');
    }
  } catch {
    return t.length > 200 ? `${t.slice(0, 200)}…` : t;
  }
  return '';
}

/**
 * 확장 API(온보딩·키링·서재 등)용 Bearer 후보.
 * 1) 확장 전용 JWT(교환/로그인 응답)
 * 2) Google idToken — 8s8k가 Google 검증을 쓰는 경우
 * 3) 로그인 JWT — login·8s8k JWT_SECRET이 같을 때
 */
export async function getExtendedApiBearerCandidates(): Promise<string[]> {
  const extended = await getExtendedAccessToken();
  const idToken = await getGoogleIdToken();
  const jwt = await getAccessToken();
  return [...new Set([extended, idToken, jwt].filter((t): t is string => !!t && t.trim().length > 0))];
}

export async function buildExtendedApiHeaders(
  bearerToken: string,
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${bearerToken}`,
    ...extra,
  };

  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const userId = await getCachedUserId();
  if (userId) {
    headers['x-user-id'] = userId;
  }

  return headers;
}

export function formatExtendedApiError(status: number, body: string, context: string): string {
  if (isInvalidTokenDetail(body)) {
    return [
      `${context} 서버가 로그인 토큰을 인식하지 못했습니다.`,
      '로그인 서버(daedokdan-login)와 확장 API(daedokdan-api-8s8k)의 JWT_SECRET 설정이 일치하는지 백엔드에서 확인해 주세요.',
      '앱을 재설치·재로그인해도 동일하면 서버 설정 문제입니다.',
    ].join('\n');
  }
  const detail = parseApiErrorDetail(body);
  if (detail) return detail;
  return `${context} 요청 실패 (HTTP ${status})`;
}

export type BearerTokenKind = 'extended-jwt' | 'google-id-token' | 'login-jwt';

export type MaskedBearerTokenInfo = {
  present: boolean;
  isNull: boolean;
  isUndefined: boolean;
  isEmptyString: boolean;
  length: number;
  /** 마스킹된 `Authorization` 헤더 값 (백엔드 공유용) */
  authorizationHeader: string | null;
};

export function maskBearerToken(token: string | null | undefined): MaskedBearerTokenInfo {
  if (token === undefined) {
    return {
      present: false,
      isNull: false,
      isUndefined: true,
      isEmptyString: false,
      length: 0,
      authorizationHeader: null,
    };
  }
  if (token === null) {
    return {
      present: false,
      isNull: true,
      isUndefined: false,
      isEmptyString: false,
      length: 0,
      authorizationHeader: null,
    };
  }
  const trimmed = token.trim();
  if (!trimmed) {
    return {
      present: false,
      isNull: false,
      isUndefined: false,
      isEmptyString: true,
      length: 0,
      authorizationHeader: 'Bearer ',
    };
  }
  const preview =
    trimmed.length <= 24 ? trimmed : `${trimmed.slice(0, 14)}…${trimmed.slice(-8)}`;
  return {
    present: true,
    isNull: false,
    isUndefined: false,
    isEmptyString: false,
    length: trimmed.length,
    authorizationHeader: `Bearer ${preview}`,
  };
}

export function describeBearerTokenKind(
  token: string,
  extended: string | null,
  idToken: string | null,
): BearerTokenKind {
  if (extended && token === extended) return 'extended-jwt';
  if (idToken && token === idToken) return 'google-id-token';
  return 'login-jwt';
}

/**
 * 8s8k 내 서재·프로필·온보딩과 동일하게 로그인 JWT를 우선 사용.
 * 401 invalid token 시에만 다른 후보를 시도합니다.
 */
export async function getProofUploadBearerCandidates(): Promise<string[]> {
  const loginJwt = await getAccessToken();
  const others = await getExtendedApiBearerCandidates();
  if (loginJwt?.trim()) {
    return [loginJwt.trim(), ...others.filter((t) => t !== loginJwt.trim())];
  }
  return others;
}

export type BearerAuthDiagnostics = {
  loginJwt: MaskedBearerTokenInfo;
  extendedJwt: MaskedBearerTokenInfo;
  googleIdToken: MaskedBearerTokenInfo;
  /** 내 서재·프로필 등 8s8k JSON API가 사용하는 토큰 (`getAccessToken`) */
  libraryApiToken: MaskedBearerTokenInfo & { source: 'getAccessToken' };
  proofUploadCandidates: Array<MaskedBearerTokenInfo & { index: number; kind: BearerTokenKind }>;
  proofUploadMatchesLibraryFirst: boolean;
};

export async function collectBearerAuthDiagnostics(): Promise<BearerAuthDiagnostics> {
  const extended = await getExtendedAccessToken();
  const idToken = await getGoogleIdToken();
  const loginJwt = await getAccessToken();
  const candidates = await getProofUploadBearerCandidates();

  const libraryMasked = maskBearerToken(loginJwt);
  const firstCandidate = candidates[0] ?? null;

  return {
    loginJwt: maskBearerToken(loginJwt),
    extendedJwt: maskBearerToken(extended),
    googleIdToken: maskBearerToken(idToken),
    libraryApiToken: { ...libraryMasked, source: 'getAccessToken' },
    proofUploadCandidates: candidates.map((token, index) => ({
      ...maskBearerToken(token),
      index,
      kind: describeBearerTokenKind(token, extended, idToken),
    })),
    proofUploadMatchesLibraryFirst:
      !!libraryMasked.present &&
      !!firstCandidate &&
      loginJwt?.trim() === firstCandidate,
  };
}

type ExtendedTokenKind = BearerTokenKind;

function describeTokenKind(token: string, extended: string | null, idToken: string | null): ExtendedTokenKind {
  return describeBearerTokenKind(token, extended, idToken);
}

/**
 * 로그인 직후 확장 API용 JWT 교환 시도 (백엔드에 `/api/auth/extended-token` 추가 시 사용).
 * 이미 저장된 extended JWT가 있으면 스킵합니다.
 */
export async function syncExtendedApiSession(options: {
  loginJwt: string;
  idToken?: string;
  platform: 'web' | 'android' | 'ios';
}): Promise<void> {
  const existing = await getExtendedAccessToken();
  if (existing) return;

  const url = `${LOGIN_API_BASE_URL}/api/auth/extended-token`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${options.loginJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(options.idToken ? { idToken: options.idToken } : {}),
        platform: options.platform,
      }),
    });

    if (!res.ok) return;

    const data = (await res.json()) as Record<string, unknown>;
    const token =
      (typeof data.extendedAccessToken === 'string' && data.extendedAccessToken) ||
      (typeof data.accessToken === 'string' && data.accessToken) ||
      (typeof data.token === 'string' && data.token) ||
      null;

    if (token) {
      await saveExtendedAccessToken(token);
      if (__DEV__) {
        console.log('[extendedApiAuth] extended-token exchange ok');
      }
    }
  } catch {
    // 교환 엔드포인트 미배포 시 무시
  }
}

/**
 * 확장 API 호스트에 Authorization 후보를 순서대로 시도.
 */
export async function fetchExtendedApiWithAuth(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const extended = await getExtendedAccessToken();
  const idToken = await getGoogleIdToken();
  const tokens = await getExtendedApiBearerCandidates();
  if (tokens.length === 0) {
    throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
  }

  const extraHeaders = (init.headers as Record<string, string> | undefined) ?? {};
  let lastStatus = 0;
  let lastBody = '';

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const headers = await buildExtendedApiHeaders(token, extraHeaders);
    const res = await fetch(url, { ...init, headers });
    if (res.ok) {
      if (__DEV__) {
        const kind = describeTokenKind(token, extended, idToken);
        console.log(`[extendedApiAuth] OK (${kind})`);
      }
      return res;
    }

    lastStatus = res.status;
    lastBody = await res.text().catch(() => '');

    const hasAnotherToken = i < tokens.length - 1;
    if (res.status === 401 && isInvalidTokenDetail(lastBody) && hasAnotherToken) {
      continue;
    }
    break;
  }

  if (__DEV__) {
    console.warn('[extendedApiAuth] all bearer candidates rejected', {
      status: lastStatus,
    });
  }

  throw new Error(formatExtendedApiError(lastStatus, lastBody, '온보딩'));
}
