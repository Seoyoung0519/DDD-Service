import { USER_API_BASE_URL, KEYRING_API_BASE_URL } from '@/src/config/api';
import {
  fetchCurrentUser,
  getAccessToken,
  getCachedUserId,
} from '@/src/services/auth/authService';
import { fetchOnboardingState } from '@/src/services/onboarding/onboardingService';
import {
  getCachedOnboardingProfile,
  mergeUserProfileWithCache,
  saveCachedAccountProfile,
  saveCachedReadingProfile,
  saveCachedUserProfileSnapshot,
} from '@/src/services/onboarding/onboardingProfileCache';
import { isInvalidTokenDetail, parseApiErrorDetail } from '@/src/utils/extendedApiAuth';

function normalizeUserProfile(raw: unknown): UserProfileResponse {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const base = raw as UserProfileResponse;
  const avatarRaw = o.avatarId ?? o.avatar_id;
  const avatarId =
    typeof avatarRaw === 'string' && avatarRaw.trim() ? avatarRaw.trim() : null;
  const avatarUrlRaw = o.avatarUrl ?? o.avatar_url;
  const avatarUrl =
    typeof avatarUrlRaw === 'string' && avatarUrlRaw.trim() ? avatarUrlRaw.trim() : null;
  const nicknameRaw = o.nickname;
  const nickname =
    typeof nicknameRaw === 'string' && nicknameRaw.trim() ? nicknameRaw.trim() : base.nickname ?? null;

  return {
    ...base,
    userId: typeof o.userId === 'string' ? o.userId : typeof o.user_id === 'string' ? o.user_id : base.userId,
    email: typeof o.email === 'string' ? o.email : base.email ?? null,
    nickname,
    avatarId,
    avatarUrl,
  };
}

export interface UserProfileResponse {
  userId: string;
  email: string | null;
  isOnboarded: boolean;
  onboardedAt: string | null;
  userType: string | null;
  onboardingStep: string | null;
  nickname: string | null;
  preferredGenres: string[] | null;
  readingSpeed: string | null;
  weeklyReadCount: number | null;
  initialPPM: number | null;
  currentPPM: number | null;
  initialPPMSetAt: string | null;
  avatarId: string | null;
  avatarUrl: string | null;
}

export interface CheckNicknameResponse {
  available: boolean;
  reason?: 'length';
}

export interface UpdateUserProfileRequest {
  nickname?: string | null;
  avatarId?: string | null;
}

export interface UpdateUserProfileResponse {
  ok: boolean;
  nickname: string | null;
  avatarId: string | null;
}

async function fetchUserProfileApi(url: string, init: RequestInit = {}): Promise<Response> {
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

  return fetch(url, { ...init, headers });
}

function formatUserProfileError(status: number, body: string): string {
  if (isInvalidTokenDetail(body)) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
  }
  const detail = parseApiErrorDetail(body);
  if (detail && !/^internal server error$/i.test(detail)) {
    return detail;
  }
  if (status >= 500) {
    return '프로필 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.';
  }
  return detail || `프로필 요청 실패 (HTTP ${status})`;
}

async function buildFallbackUserProfile(): Promise<UserProfileResponse | null> {
  try {
    const [me, onboarding, cachedUserId, cache] = await Promise.all([
      fetchCurrentUser().catch(() => null),
      fetchOnboardingState().catch(() => null),
      getCachedUserId(),
      getCachedOnboardingProfile(),
    ]);

    const userId = me?.id ?? onboarding?.userId ?? cachedUserId;
    if (!userId) return null;

    const base: UserProfileResponse = {
      userId,
      email: me?.email ?? null,
      isOnboarded: onboarding?.isOnboarded ?? me?.isOnboardingCompleted ?? false,
      onboardedAt: null,
      userType: onboarding?.userType ?? cache?.userType ?? null,
      onboardingStep: onboarding?.step ?? null,
      nickname: cache?.reading?.nickname?.trim() || me?.name?.trim() || null,
      preferredGenres: cache?.reading?.preferredGenres ?? null,
      readingSpeed: cache?.reading?.readingSpeed ?? null,
      weeklyReadCount: cache?.reading?.weeklyReadCount ?? null,
      initialPPM: null,
      currentPPM: null,
      initialPPMSetAt: null,
      avatarId: null,
      avatarUrl: me?.avatarUrl ?? null,
    };

    return mergeUserProfileWithCache(base, cache);
  } catch {
    return null;
  }
}

async function tryHydrateNicknameFromReviews(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetch(`${KEYRING_API_BASE_URL}/reviews/my`, { headers });
    if (!res.ok) return null;

    const data = (await res.json()) as unknown;
    const list = Array.isArray(data)
      ? data
      : data != null && typeof data === 'object'
        ? ((data as Record<string, unknown>).items ??
          (data as Record<string, unknown>).reviews ??
          [])
        : [];
    if (!Array.isArray(list) || list.length === 0) return null;

    const first = list[0] as Record<string, unknown>;
    const nick = first.userNickname ?? first.user_nickname;
    return typeof nick === 'string' && nick.trim() ? nick.trim() : null;
  } catch {
    return null;
  }
}

async function finalizeUserProfile(profile: UserProfileResponse): Promise<UserProfileResponse> {
  const cache = await getCachedOnboardingProfile();
  let merged = mergeUserProfileWithCache(profile, cache);

  if (!merged.nickname?.trim()) {
    const fromReviews = await tryHydrateNicknameFromReviews();
    if (fromReviews) {
      merged = { ...merged, nickname: fromReviews };
      const reading = cache?.reading;
      await saveCachedReadingProfile(
        reading
          ? { ...reading, nickname: fromReviews }
          : {
              nickname: fromReviews,
              preferredGenres: merged.preferredGenres ?? [],
              readingSpeed:
                merged.readingSpeed === 'slow' || merged.readingSpeed === 'fast'
                  ? merged.readingSpeed
                  : 'normal',
              weeklyReadCount: merged.weeklyReadCount ?? 1,
            },
      );
    }
  }

  void saveCachedUserProfileSnapshot(merged);
  return merged;
}

export async function getUserProfile(): Promise<UserProfileResponse> {
  const url = `${USER_API_BASE_URL}/user/profile`;
  const res = await fetchUserProfileApi(url);

  if (res.ok) {
    const profile = normalizeUserProfile(await res.json());
    return finalizeUserProfile(profile);
  }

  const body = await res.text().catch(() => '');

  if (res.status >= 500) {
    const fallback = await buildFallbackUserProfile();
    if (fallback) {
      if (__DEV__) {
        console.warn('[userProfile] GET /user/profile 500 — 캐시·세션 기반 프로필 사용', {
          userId: fallback.userId,
          nickname: fallback.nickname,
        });
      }
      return finalizeUserProfile(fallback);
    }
  }

  if (__DEV__) {
    console.warn('[userProfile] GET /user/profile failed', {
      status: res.status,
      body: body.slice(0, 200),
    });
  }

  throw new Error(formatUserProfileError(res.status, body));
}

/** 온보딩 수정 화면 — 저장된 로컬 캐시를 API보다 우선해 최근 수정값을 표시 */
export async function loadOnboardingProfileForEdit(): Promise<UserProfileResponse> {
  const cache = await getCachedOnboardingProfile();
  try {
    const profile = await getUserProfile();
    return mergeUserProfileWithCache(profile, cache);
  } catch {
    const fallback = await buildFallbackUserProfile();
    if (fallback) return mergeUserProfileWithCache(fallback, cache);
    throw new Error('프로필을 불러오지 못했습니다.');
  }
}

export async function checkNicknameAvailable(nickname: string): Promise<CheckNicknameResponse> {
  const trimmed = nickname.trim();
  const url = `${USER_API_BASE_URL}/user/profile/check-nickname?nickname=${encodeURIComponent(trimmed)}`;
  const res = await fetchUserProfileApi(url);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(formatUserProfileError(res.status, body));
  }

  return (await res.json()) as CheckNicknameResponse;
}

export async function updateUserProfile(
  payload: UpdateUserProfileRequest,
): Promise<UpdateUserProfileResponse> {
  const res = await fetchUserProfileApi(`${USER_API_BASE_URL}/user/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(formatUserProfileError(res.status, body));
  }

  const result = (await res.json()) as UpdateUserProfileResponse;

  await saveCachedAccountProfile({
    nickname: result.nickname ?? payload.nickname ?? null,
    avatarId: result.avatarId ?? payload.avatarId ?? null,
  });

  return result;
}

export function formatOnboardedAtLabel(onboardedAt: string | null | undefined): string {
  if (!onboardedAt) return '가입일자 정보 없음';
  const d = new Date(onboardedAt);
  if (Number.isNaN(d.getTime())) return '가입일자 정보 없음';
  return `가입일자 ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일부터 함께 독서 중`;
}

export function getNicknameCheckMessage(
  result: CheckNicknameResponse | null,
  trimmed: string,
): { tone: 'idle' | 'ok' | 'error'; message: string } {
  if (!trimmed) {
    return { tone: 'error', message: '닉네임은 1~20자여야 합니다' };
  }
  if (!result) return { tone: 'idle', message: '' };
  if (result.available) {
    return { tone: 'ok', message: '사용 가능한 닉네임입니다' };
  }
  if (result.reason === 'length') {
    return { tone: 'error', message: '닉네임은 1~20자여야 합니다' };
  }
  return { tone: 'error', message: '이미 사용 중인 닉네임입니다' };
}
