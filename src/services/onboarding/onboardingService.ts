import { LOGIN_API_BASE_URL, ONBOARDING_API_BASE_URL } from '@/src/config/api';
import { clearAccessToken, getAccessToken } from '@/src/services/auth/authService';
import {
  saveCachedCommuteProfile,
  saveCachedOnboardingUserType,
  saveCachedReadingProfile,
} from '@/src/services/onboarding/onboardingProfileCache';
import { parseApiErrorDetail } from '@/src/utils/extendedApiAuth';

/** Render 무료 서버 콜드스타트 시 무한 대기 방지 */
const BOOTSTRAP_FETCH_TIMEOUT_MS = 6000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = BOOTSTRAP_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`요청 시간 초과 (${timeoutMs}ms)`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

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
  avatarId?: string;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
}

/**
 * start 응답을 정규화합니다.
 * `userChoice`는 서버가 1~4(선지 번호)를 기대합니다. 보기 id도 동일하게 1부터 씁니다.
 */
export function parseReadingTestStartResponse(raw: unknown): ReadingTestStartResponse | null {
  const root = asRecord(raw);
  if (!root) return null;
  const src = asRecord(root.data) ?? root;
  const testId = str(src.testId ?? src.test_id);
  const textId = str(src.textId ?? src.text_id);
  const body = str(src.body ?? src.passage ?? src.text ?? src.content);
  const question = str(src.question ?? src.prompt);
  const rawChoices = src.choices ?? src.options;
  const choices = Array.isArray(rawChoices)
    ? rawChoices.map((item) => str(item)).filter((item) => item.length > 0)
    : [];
  if (!testId || !body || !question || choices.length === 0) return null;
  return {
    testId,
    textId,
    body,
    syllableCount: num(src.syllableCount ?? src.syllable_count),
    question,
    choices,
  };
}

/** 화면 선지 번호(1~4)로 서버 `userChoice`를 맞춥니다. */
export function toReadingTestUserChoice(optionId: number, choiceCount: number): number | null {
  if (!Number.isInteger(optionId)) return null;
  const max = Math.min(Math.max(choiceCount, 1), 4);
  if (optionId >= 1 && optionId <= max) return optionId;
  if (optionId >= 0 && optionId < max) return optionId + 1;
  return null;
}

async function authedOnboardingFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string> | undefined),
  };
  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const res = await fetch(`${ONBOARDING_API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const detail = parseApiErrorDetail(body);
    throw new Error(detail || `온보딩 요청 실패 (HTTP ${res.status})`);
  }
  return res;
}

async function fetchOnboardingStateResponse(): Promise<Response | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const url = `${ONBOARDING_API_BASE_URL}/onboarding/state`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
  if (apiKey) headers['x-api-key'] = apiKey;

  const res = await fetchWithTimeout(url, { method: 'GET', headers });
  return res.ok ? res : null;
}

export async function fetchOnboardingState(): Promise<OnboardingStateResponse | null> {
  const res = await fetchOnboardingStateResponse();
  if (!res) return null;

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
    fetchWithTimeout(`${LOGIN_API_BASE_URL}/api/auth/me`, { headers: authHeader }),
    (async () => {
      const res = await fetchOnboardingStateResponse();
      return res ?? new Response(null, { status: 401 });
    })(),
  ]);

  if (!meRes.ok) {
    if (meRes.status === 401) {
      await clearAccessToken();
    }
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
  const data = (await res.json()) as SetUserTypeResponse;
  await saveCachedOnboardingUserType(payload.userType);
  return data;
}

export async function submitReadingProfile(payload: ReadingProfilePayload): Promise<OkResponse> {
  const res = await authedOnboardingFetch('/onboarding/reading-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as OkResponse;
  await saveCachedReadingProfile(payload);
  return data;
}

export async function submitCommuteProfile(payload: CommuteProfilePayload): Promise<OkResponse> {
  const res = await authedOnboardingFetch('/onboarding/commute-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as OkResponse;
  await saveCachedCommuteProfile(payload);
  return data;
}

export async function startReadingTest(): Promise<ReadingTestStartResponse> {
  const res = await authedOnboardingFetch('/onboarding/reading-test/start', {
    method: 'POST',
  });
  const parsed = parseReadingTestStartResponse(await res.json());
  if (!parsed) {
    throw new Error('독서 테스트 지문·문제를 불러오지 못했습니다. 다시 시도해 주세요.');
  }
  return parsed;
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

