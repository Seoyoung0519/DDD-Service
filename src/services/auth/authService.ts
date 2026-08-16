// src/services/auth/authService.ts

import { LOGIN_API_BASE_URL } from '@/src/config/api';
import { clearOnboardingSkipped } from '@/src/services/onboarding/onboardingSkip';
import { logError, logStatus } from '@/src/utils/appLog';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 요청에 사용할 타입
export type LoginPlatform = 'web' | 'android' | 'ios';

export interface GoogleLoginPayload {
  idToken: string;
  platform: LoginPlatform;
}

export interface KakaoLoginPayload {
  accessToken: string;
  platform: LoginPlatform;
}

export interface EmailVerificationPayload {
  email: string;
  code: string;
  name?: string;
}

export interface SendEmailVerificationCodeResponse {
  message: string;
  expiresIn: number;
}

/** Google·카카오 로그인 공통 응답 */
export type AuthLoginResponse = GoogleLoginResponse;

// 백엔드 응답 타입
export interface GoogleLoginResponse {
  user: {
    id: string; // 우리 서비스 내부 user id (UUID)
    email: string;
    name: string;
    avatarUrl?: string | null;
    role?: 'user' | 'admin';
  };
  accessToken: string; // 이후 Authorization 헤더에 사용할 토큰
  expiresIn: number; // 초 단위
}

const ACCESS_TOKEN_KEY = 'daedokdan_access_token';
const GOOGLE_ACCESS_TOKEN_KEY = 'daedokdan_google_access_token';
const GOOGLE_ID_TOKEN_KEY = 'daedokdan_google_id_token';
const EXTENDED_ACCESS_TOKEN_KEY = 'daedokdan_extended_access_token';
const CACHED_USER_ID_KEY = 'daedokdan_user_id';
const AUTH_PROVIDER_KEY = 'daedokdan_auth_provider';

export type AuthProvider = 'google' | 'kakao' | 'email';

/** 콘솔용 마스킹 (전체 JWT 노출 방지) */
function maskToken(t: string): string {
  if (!t || t.length <= 14) return '***';
  return `${t.slice(0, 8)}…${t.slice(-6)}`;
}

export class AuthSessionExpiredError extends Error {
  constructor(message = '로그인이 만료되었습니다. 다시 로그인해 주세요.') {
    super(message);
    this.name = 'AuthSessionExpiredError';
  }
}

function isAuthUnauthorized(status: number, errorText: string): boolean {
  if (status !== 401) return false;
  const t = errorText.trim().toLowerCase();
  if (!t) return true;
  return (
    t.includes('invalid') ||
    t.includes('expired') ||
    t.includes('unauthorized') ||
    t.includes('token')
  );
}
export async function saveAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

// 토큰 조회 함수
export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

// Google access token 저장 (온보딩/키링 등에서 요구)
export async function saveGoogleAccessToken(token: string) {
  await AsyncStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, token);
}

export async function getGoogleAccessToken() {
  return AsyncStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
}

export async function clearGoogleAccessToken() {
  await AsyncStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
}

/** Google idToken — 확장 API(온보딩 등)에서 로그인 JWT 대신 쓸 수 있음 */
export async function saveGoogleIdToken(token: string) {
  await AsyncStorage.setItem(GOOGLE_ID_TOKEN_KEY, token);
}

export async function getGoogleIdToken() {
  return AsyncStorage.getItem(GOOGLE_ID_TOKEN_KEY);
}

export async function clearGoogleIdToken() {
  await AsyncStorage.removeItem(GOOGLE_ID_TOKEN_KEY);
}

/** 확장 API(8s8k) 전용 JWT — 로그인 서버 교환 응답 등 */
export async function saveExtendedAccessToken(token: string) {
  await AsyncStorage.setItem(EXTENDED_ACCESS_TOKEN_KEY, token);
}

export async function getExtendedAccessToken() {
  return AsyncStorage.getItem(EXTENDED_ACCESS_TOKEN_KEY);
}

export async function clearExtendedAccessToken() {
  await AsyncStorage.removeItem(EXTENDED_ACCESS_TOKEN_KEY);
}

export async function saveCachedUserId(userId: string) {
  await AsyncStorage.setItem(CACHED_USER_ID_KEY, userId);
}

export async function getCachedUserId() {
  return AsyncStorage.getItem(CACHED_USER_ID_KEY);
}

export async function clearCachedUserId() {
  await AsyncStorage.removeItem(CACHED_USER_ID_KEY);
}

export async function saveAuthProvider(provider: AuthProvider) {
  const userId = await getCachedUserId();
  const previous = await getAuthProvider();
  if (!previous && userId) {
    await migrateScopedStorageKey(`session/${userId}`, `${provider}/${userId}`);
  }
  await AsyncStorage.setItem(AUTH_PROVIDER_KEY, provider);
}

async function migrateScopedStorageKey(fromSuffix: string, toSuffix: string): Promise<void> {
  const prefixes = [
    '@daedokdan/onboarding_profile_cache',
    '@daedokdan_onboarding_skipped',
  ] as const;
  for (const prefix of prefixes) {
    const fromKey = `${prefix}/${fromSuffix}`;
    const toKey = `${prefix}/${toSuffix}`;
    const raw = await AsyncStorage.getItem(fromKey);
    if (!raw) continue;
    const existing = await AsyncStorage.getItem(toKey);
    if (!existing) {
      await AsyncStorage.setItem(toKey, raw);
    }
    await AsyncStorage.removeItem(fromKey);
  }
}

export async function getAuthProvider(): Promise<AuthProvider | null> {
  const value = await AsyncStorage.getItem(AUTH_PROVIDER_KEY);
  return value === 'google' || value === 'kakao' || value === 'email' ? value : null;
}

export async function clearAuthProvider() {
  await AsyncStorage.removeItem(AUTH_PROVIDER_KEY);
}

/** 구글·카카오 등 로그인 방식별 로컬 데이터 분리용 키 접미사 */
export async function getAuthScopedStorageSuffix(): Promise<string | null> {
  const userId = await getCachedUserId();
  if (!userId) return null;
  const provider = await getAuthProvider();
  return `${provider ?? 'session'}/${userId}`;
}

/**
 * 메인 API(검색/책장/책 상세/읽기 세션 등) Authorization
 *
 * **항상** 로그인 응답에서 저장한 백엔드 JWT만 사용합니다 (`daedokdan_access_token` → `getAccessToken`).
 * Google OAuth access token은 이 경로에 넣지 않습니다. (메인 API가 JWT만 검증하는 경우가 많음)
 *
 * 401이 계속되면: 토큰 만료 → 재로그인, 또는 로그인 서버·메인 API 간 JWT 검증 설정 불일치를 백엔드에서 확인.
 */
export async function getMainApiAccessToken(): Promise<string | null> {
  return getAccessToken();
}

// 토큰 삭제 함수
export async function clearAccessToken() {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    GOOGLE_ACCESS_TOKEN_KEY,
    GOOGLE_ID_TOKEN_KEY,
    EXTENDED_ACCESS_TOKEN_KEY,
    CACHED_USER_ID_KEY,
    AUTH_PROVIDER_KEY,
  ]);
  await clearOnboardingSkipped();
}

export type PrintAccessTokenDebugOptions = {
  /** true면 __DEV__에서만 메인 API용 JWT 전체를 한 번 출력 (유출 주의) */
  logFullJwt?: boolean;
};

/**
 * 저장된 액세스 토큰 상태 확인용 (Metro/디버거 콘솔).
 * - 메인 API: `daedokdan_access_token` → `getAccessToken()` (백엔드 JWT)
 * - Google OAuth: `daedokdan_google_access_token` (별도)
 *
 * 사용 예: 컴포넌트에서 `useEffect(() => { void printAccessTokenDebug(); }, []);` 임시 호출
 */
export async function printAccessTokenDebug(
  options?: PrintAccessTokenDebugOptions,
): Promise<void> {
  if (!__DEV__) {
    console.warn('[AUTH] printAccessTokenDebug는 개발 빌드(__DEV__)에서만 동작합니다.');
    return;
  }
  const jwt = await getAccessToken();
  const google = await getGoogleAccessToken();
  console.log('[AUTH] ========== access token debug ==========');
  console.log(
    '[AUTH] Main API JWT (AsyncStorage daedokdan_access_token):',
    jwt
      ? { length: jwt.length, masked: maskToken(jwt) }
      : '(없음 — 로그인 필요)',
  );
  if (options?.logFullJwt && jwt) {
    console.log('[AUTH] Main API JWT: present');
  }
  console.log(
    '[AUTH] Google OAuth token:',
    google
      ? { length: google.length, masked: maskToken(google) }
      : '(없음)',
  );
  console.log('[AUTH] =========================================');
}

function emailAuthErrorMessage(status: number, body: string, fallback: string): string {
  let detail = body.trim();
  try {
    const parsed = JSON.parse(body) as { error?: unknown; detail?: unknown; message?: unknown };
    detail = [parsed.error, parsed.detail, parsed.message]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join('\n');
  } catch {
    // 일반 텍스트 응답
  }
  if (status === 429) return detail || '인증 코드는 1분 후 다시 요청할 수 있습니다.';
  if (status === 401) return detail || '인증 코드가 올바르지 않거나 만료되었습니다.';
  return detail || `${fallback} (HTTP ${status})`;
}

async function postEmailAuth<T>(
  path: '/api/auth/email/send-code' | '/api/auth/email/verify',
  body: Record<string, unknown>,
  fallback: string,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(`${LOGIN_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (reason) {
    if (reason instanceof Error && reason.name === 'AbortError') {
      throw new Error('로그인 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error('네트워크 연결을 확인해 주세요.');
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    if (__DEV__) {
      console.warn('[AUTH] Email auth request failed:', {
        path,
        status: res.status,
        elapsedMs: Date.now() - startedAt,
        codeLength: typeof body.code === 'string' ? body.code.length : undefined,
      });
    }
    throw new Error(emailAuthErrorMessage(res.status, text, fallback));
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('서버 응답을 처리하지 못했습니다.');
  }
}

export function sendEmailVerificationCode(
  email: string,
): Promise<SendEmailVerificationCodeResponse> {
  return postEmailAuth<SendEmailVerificationCodeResponse>(
    '/api/auth/email/send-code',
    { email: email.trim().toLowerCase() },
    '인증 코드 발송에 실패했습니다.',
  );
}

export async function verifyEmailCode(
  payload: EmailVerificationPayload,
): Promise<AuthLoginResponse> {
  const data = await postEmailAuth<AuthLoginResponse>(
    '/api/auth/email/verify',
    {
      email: payload.email.trim().toLowerCase(),
      code: payload.code.trim(),
      ...(payload.name?.trim() ? { name: payload.name.trim() } : {}),
    },
    '이메일 인증에 실패했습니다.',
  );

  if (!data.accessToken || !data.user?.id) {
    throw new Error('로그인 응답에 필요한 사용자 정보가 없습니다.');
  }
  await saveAccessToken(data.accessToken);
  await saveCachedUserId(data.user.id);
  await saveAuthProvider('email');
  return data;
}

async function postSocialLogin(
  path: '/api/auth/google' | '/api/auth/kakao',
  body: Record<string, unknown>,
): Promise<AuthLoginResponse> {
  const url = `${LOGIN_API_BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (fetchError: unknown) {
    const message =
      fetchError instanceof Error
        ? fetchError.message
        : '네트워크 연결을 확인해주세요. 서버에 연결할 수 없습니다.';
    console.error('[AUTH] Network error during login');
    throw new Error(message);
  }

  if (!res.ok) {
    let errorText = '';
    try {
      errorText = await res.text();
    } catch {
      errorText = 'Failed to read error response';
    }

    const statusCode =
      typeof res.status === 'number' && !Number.isNaN(res.status)
        ? res.status
        : parseInt(String(res.status), 10) || 0;

    logError('AUTH', `로그인 실패 status=${statusCode}`);

    const trimmed = errorText?.trim() ?? '';
    let detail = trimmed || res.statusText?.trim() || '';
    try {
      const parsed = JSON.parse(trimmed) as { error?: string; detail?: string };
      if (typeof parsed.error === 'string') detail = parsed.error;
      if (typeof parsed.detail === 'string' && parsed.detail) {
        detail = `${detail}\n${parsed.detail}`;
      }
    } catch {
      // plain text body
    }

    if (statusCode === 503 || statusCode === 502) {
      throw new Error(
        '로그인 서버가 일시적으로 응답하지 않습니다. (503)\n잠시 후 다시 시도하거나, 호스팅(예: Render) 상태를 확인해 주세요.',
      );
    }
    if (statusCode === 504) {
      throw new Error(
        '로그인 요청 시간이 초과되었습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
      );
    }

    const errorMessage = detail
      ? `로그인 실패 (${statusCode}): ${detail}`
      : `로그인 실패 (${statusCode}). 서버 메시지가 없습니다. 잠시 후 다시 시도해 주세요.`;
    throw new Error(errorMessage);
  }

  let data: AuthLoginResponse;
  try {
    data = await res.json();
  } catch (jsonError: unknown) {
    logError('AUTH', '응답 파싱 실패');
    throw new Error('서버 응답을 처리하는 중 오류가 발생했습니다.');
  }

  await saveAccessToken(data.accessToken);
  await saveCachedUserId(data.user.id);
  await saveAuthProvider(path === '/api/auth/kakao' ? 'kakao' : 'google');

  const raw = data as AuthLoginResponse & Record<string, unknown>;
  for (const key of ['extendedAccessToken', 'extendedToken', 'apiAccessToken'] as const) {
    const candidate = raw[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      await saveExtendedAccessToken(candidate);
      break;
    }
  }

  if (__DEV__) {
    logStatus('AUTH', '로그인 성공');
  }

  return data;
}

// Google 로그인 API 호출
export async function loginWithGoogle(
  payload: GoogleLoginPayload,
): Promise<GoogleLoginResponse> {
  const { idToken, platform } = payload;

  // idToken 유효성 검증
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    logError('AUTH', 'idToken 없음');
    throw new Error('유효하지 않은 idToken입니다.');
  }

  // idToken이 JWT 형식인지 확인 (3개의 점으로 구분된 부분이 있어야 함)
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    logError('AUTH', 'idToken 형식 오류');
    throw new Error('idToken 형식이 올바르지 않습니다.');
  }

  // idToken 디코딩해서 정보 확인 (디버깅용)
  try {
    const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const base64 = base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4);
    
    // base64 디코딩 (웹과 React Native 모두 지원)
    let decodedString = '';
    if (typeof atob !== 'undefined') {
      // 웹 환경
      decodedString = atob(base64);
    } else {
      // React Native 환경 - base64 디코딩
      // @ts-ignore
      if (typeof global !== 'undefined' && global.btoa) {
        // @ts-ignore
        decodedString = global.atob(base64);
      } else {
        // base64 디코딩을 위한 간단한 구현
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = '';
        let i = 0;
        while (i < base64.length) {
          const enc1 = chars.indexOf(base64.charAt(i++));
          const enc2 = chars.indexOf(base64.charAt(i++));
          const enc3 = chars.indexOf(base64.charAt(i++));
          const enc4 = chars.indexOf(base64.charAt(i++));
          const chr1 = (enc1 << 2) | (enc2 >> 4);
          const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          const chr3 = ((enc3 & 3) << 6) | enc4;
          str += String.fromCharCode(chr1);
          if (enc3 !== 64) str += String.fromCharCode(chr2);
          if (enc4 !== 64) str += String.fromCharCode(chr3);
        }
        decodedString = str;
      }
    }
    
    const payload = JSON.parse(decodedString);
    
    // 클라이언트 ID 확인 (로그 없이 검증만 수행)
    const expectedWebClientId = '812023573352-hb556lik81tjpmr9jsaoqigbnhlt50kp.apps.googleusercontent.com';
    const expectedAndroidClientId = '812023573352-8t9uudrc8c1p29iht9a0t432l06cc15d.apps.googleusercontent.com';
    
    if (payload.aud !== expectedWebClientId && payload.aud !== expectedAndroidClientId) {
      console.warn('[AUTH] ⚠️ idToken audience mismatch');
    }
  } catch (e) {
    // 디코딩 실패는 무시 (백엔드에서 검증)
  }

  const requestBody = { idToken, platform };
  return postSocialLogin('/api/auth/google', requestBody);
}

/** 카카오 로그인 — POST /api/auth/kakao */
export async function loginWithKakao(payload: KakaoLoginPayload): Promise<AuthLoginResponse> {
  const { accessToken, platform } = payload;

  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    throw new Error('유효하지 않은 카카오 accessToken입니다.');
  }

  return postSocialLogin('/api/auth/kakao', { accessToken, platform });
}

// 세션 체크 함수
export async function checkSession(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(`${LOGIN_API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (isAuthUnauthorized(res.status, await res.text().catch(() => ''))) {
      await clearAccessToken();
      return false;
    }
    return res.ok;
  } catch {
    return false;
  }
}

// 현재 로그인 유저 정보 조회
export async function fetchCurrentUser() {
  const token = await getAccessToken();
  if (!token) {
    throw new AuthSessionExpiredError('로그인 토큰이 없습니다.');
  }

  const res = await fetch(`${LOGIN_API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    if (isAuthUnauthorized(res.status, errorText)) {
      await clearAccessToken();
      if (__DEV__) {
        console.warn('[AUTH] 세션 만료 — 저장된 토큰을 삭제했습니다.');
      }
      throw new AuthSessionExpiredError();
    }
    console.error('[AUTH] /me failed', res.status);
    throw new Error('내 정보 조회 실패');
  }

  const data = await res.json();
  return data as {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    role?: 'user' | 'admin';
    isOnboardingCompleted?: boolean; // 온보딩 완료 여부
  };
}

// 온보딩 완료 여부 체크 함수
export async function checkOnboardingCompleted(): Promise<boolean> {
  try {
    const user = await fetchCurrentUser();
    return user.isOnboardingCompleted === true;
  } catch (e) {
    // 사용자 정보 조회 실패 시 온보딩 미완료로 간주
    return false;
  }
}

