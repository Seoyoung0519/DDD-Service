// src/services/auth/authService.ts

import { LOGIN_API_BASE_URL } from '@/src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 요청에 사용할 타입
export type LoginPlatform = 'web' | 'android' | 'ios';

export interface GoogleLoginPayload {
  idToken: string;
  platform: LoginPlatform;
}

// 백엔드 응답 타입
export interface GoogleLoginResponse {
  user: {
    id: string; // 우리 서비스 내부 user id (UUID)
    email: string;
    name: string;
    avatarUrl?: string | null;
  };
  accessToken: string; // 이후 Authorization 헤더에 사용할 토큰
  expiresIn: number; // 초 단위
}

const ACCESS_TOKEN_KEY = 'daedokdan_access_token';
const GOOGLE_ACCESS_TOKEN_KEY = 'daedokdan_google_access_token';

/** 콘솔용 마스킹 (전체 JWT 노출 방지) */
function maskToken(t: string): string {
  if (!t || t.length <= 14) return '***';
  return `${t.slice(0, 8)}…${t.slice(-6)}`;
}

// 토큰 저장 함수
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
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
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
    console.log('[AUTH] Main API JWT FULL (__DEV__ only):', jwt);
  }
  console.log(
    '[AUTH] Google OAuth token:',
    google
      ? { length: google.length, masked: maskToken(google) }
      : '(없음)',
  );
  console.log('[AUTH] =========================================');
}

// Google 로그인 API 호출
export async function loginWithGoogle(
  payload: GoogleLoginPayload,
): Promise<GoogleLoginResponse> {
  const { idToken, platform } = payload;

  // idToken 유효성 검증
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    console.error('[AUTH] Invalid idToken:', {
      idToken: idToken,
      type: typeof idToken,
      length: idToken?.length,
    });
    throw new Error('유효하지 않은 idToken입니다.');
  }

  // idToken이 JWT 형식인지 확인 (3개의 점으로 구분된 부분이 있어야 함)
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    console.error('[AUTH] Invalid idToken format:', {
      partsCount: parts.length,
      idTokenLength: idToken.length,
      idTokenPreview: idToken.substring(0, 50) + '...',
    });
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
  const url = `${LOGIN_API_BASE_URL}/api/auth/google`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (fetchError: any) {
    console.error('[AUTH] Network error during login:', fetchError);
    throw new Error(
      fetchError?.message || '네트워크 연결을 확인해주세요. 서버에 연결할 수 없습니다.'
    );
  }

  if (!res.ok) {
    let errorText = '';
    try {
      errorText = await res.text();
    } catch (e) {
      errorText = 'Failed to read error response';
    }

    /** RN/fetch 환경에 따라 status가 문자열로 올 수 있음 */
    const statusCode =
      typeof res.status === 'number' && !Number.isNaN(res.status)
        ? res.status
        : parseInt(String(res.status), 10) || 0;

    console.error('[AUTH] Login failed:', {
      status: statusCode,
      statusText: res.statusText,
      errorText,
    });

    const trimmed = errorText?.trim() ?? '';
    const detail = trimmed || res.statusText?.trim() || '';

    /** 502/503 — 본문·statusText가 비는 경우가 많음 (게이트웨이/Render 등) */
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

  let data: GoogleLoginResponse;
  try {
    data = await res.json();
  } catch (jsonError: any) {
    console.error('[AUTH] JSON parse error:', jsonError);
    throw new Error('서버 응답을 처리하는 중 오류가 발생했습니다.');
  }

  // accessToken 저장
  await saveAccessToken(data.accessToken);

  if (__DEV__) {
    console.log('[AUTH] ✅ Login success:', {
      email: data.user.email,
      userId: data.user.id,
      accessTokenLength: data.accessToken.length,
      expiresIn: data.expiresIn,
    });
    // 개발 빌드에서만 전체 JWT 출력 (릴리스 __DEV__ === false 이면 출력 안 됨)
    console.log('[AUTH] accessToken (full):', data.accessToken);
  }
  return data;
}

// 세션 체크 함수
export async function checkSession(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    // 토큰 유효성 검증을 위해 백엔드에 요청
    const res = await fetch(`${LOGIN_API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// 현재 로그인 유저 정보 조회
export async function fetchCurrentUser() {
  const token = await getAccessToken();
  if (!token) throw new Error('로그인 토큰이 없습니다.');

  const res = await fetch(`${LOGIN_API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error('[AUTH] /me failed:', res.status, errorText);
    throw new Error('내 정보 조회 실패');
  }

  const data = await res.json();
  return data as {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
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

