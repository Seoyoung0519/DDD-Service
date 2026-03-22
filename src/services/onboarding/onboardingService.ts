import { LOGIN_API_BASE_URL, ONBOARDING_API_BASE_URL } from '@/src/config/api';
import { getAccessToken } from '@/src/services/auth/authService';

export type OnboardingUserType = 'worker_student' | 'other';

export type OnboardingNextAction =
  | 'select_user_type'
  | 'fill_reading_profile'
  | 'fill_commute_profile'
  | 'start_reading_test'
  | 'finish_reading_test'
  | 'none';

export interface OnboardingStateResponse {
  userId: string;
  userType: OnboardingUserType | null;
  step: string;
  isOnboarded: boolean;
  nextAction: OnboardingNextAction;
  required?: string[];
}

export type CommuteDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

/** AsyncStorage: `startReadingTest` 응답을 Onboarding_6에서 읽기 위한 키 */
export const ONBOARDING_READING_TEST_STORAGE_KEY = '@onboarding_reading_test_start';

export type ReadingSpeed = 'slow' | 'normal' | 'fast';

export interface SetUserTypePayload {
  userType: OnboardingUserType;
}

export interface SetUserTypeResponse {
  ok: true;
  userType: OnboardingUserType;
}

export interface ReadingProfilePayload {
  nickname: string;
  preferredGenres: string[];
  readingSpeed: ReadingSpeed;
  weeklyReadCount: number;
}

export interface OkResponse {
  ok: true;
}

export interface CommuteProfilePayload {
  name: string;
  originName: string;
  destinationName: string;
  commuteHour: number;
  commuteMinute: number;
  commuteDays: CommuteDay[];
  departHour: number;
  departMinute: number;
  returnHour: number;
  returnMinute: number;
}

export interface ReadingTestStartResponse {
  testId: string;
  textId: string;
  body: string;
  syllableCount: number;
  question: string;
  choices: string[];
}

export interface ReadingTestFinishPayload {
  testId: string;
  elapsedSeconds: number;
  userChoice: number;
}

export interface ReadingTestFinishResponse {
  elapsedSeconds: number;
  ppm: number;
  isCorrect: boolean;
  isOnboarded: boolean;
}

export interface ReadingTestSkipResponse {
  isOnboarded: boolean;
}

async function authedOnboardingFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
  }

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${ONBOARDING_API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `온보딩 API 요청 실패 (status: ${res.status})`);
  }

  return res;
}

export async function fetchOnboardingState(): Promise<OnboardingStateResponse | null> {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const url = `${ONBOARDING_API_BASE_URL}/onboarding/state`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    // 온보딩 상태 조회 실패 시에는 온보딩 미완료로 간주하고 null 반환
    return null;
  }

  const data = (await res.json()) as OnboardingStateResponse;
  return data;
}

/**
 * 앱 시작 시 `/api/auth/me` 와 `/onboarding/state` 를 **병렬** 호출해
 * 순차 대기(로그인 서버 → 온보딩 서버)로 인한 지연을 줄임.
 */
export async function fetchBootstrapSessionAndOnboarding(): Promise<{
  hasValidSession: boolean;
  onboarding: OnboardingStateResponse | null;
}> {
  const token = await getAccessToken();
  if (!token) {
    return { hasValidSession: false, onboarding: null };
  }

  const authHeader = { Authorization: `Bearer ${token}` };

  const [meRes, onboardingRes] = await Promise.all([
    fetch(`${LOGIN_API_BASE_URL}/api/auth/me`, { headers: authHeader }),
    fetch(`${ONBOARDING_API_BASE_URL}/onboarding/state`, { headers: authHeader }),
  ]);

  if (!meRes.ok) {
    return { hasValidSession: false, onboarding: null };
  }

  if (!onboardingRes.ok) {
    return { hasValidSession: true, onboarding: null };
  }

  try {
    const data = (await onboardingRes.json()) as OnboardingStateResponse;
    return { hasValidSession: true, onboarding: data };
  } catch {
    return { hasValidSession: true, onboarding: null };
  }
}

export async function setOnboardingUserType(
  payload: SetUserTypePayload,
): Promise<SetUserTypeResponse> {
  const res = await authedOnboardingFetch('/onboarding/user-type', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as SetUserTypeResponse;
}

export async function submitReadingProfile(payload: ReadingProfilePayload): Promise<OkResponse> {
  const res = await authedOnboardingFetch('/onboarding/reading-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as OkResponse;
}

export async function submitCommuteProfile(payload: CommuteProfilePayload): Promise<OkResponse> {
  const res = await authedOnboardingFetch('/onboarding/commute-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as OkResponse;
}

export async function startReadingTest(): Promise<ReadingTestStartResponse> {
  const res = await authedOnboardingFetch('/onboarding/reading-test/start', {
    method: 'POST',
  });
  return (await res.json()) as ReadingTestStartResponse;
}

export async function finishReadingTest(
  payload: ReadingTestFinishPayload,
): Promise<ReadingTestFinishResponse> {
  const res = await authedOnboardingFetch('/onboarding/reading-test/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await res.json()) as ReadingTestFinishResponse;
}

export async function skipReadingTest(): Promise<ReadingTestSkipResponse> {
  const res = await authedOnboardingFetch('/onboarding/reading-test/skip', {
    method: 'POST',
  });
  return (await res.json()) as ReadingTestSkipResponse;
}

