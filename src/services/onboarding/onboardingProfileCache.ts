import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  CommuteProfilePayload,
  OnboardingUserType,
  ReadingProfilePayload,
  ReadingSpeed,
} from '@/src/services/onboarding/onboardingService';
import type { UserProfileResponse } from '@/src/api/userProfile';

/** v1 — 로그인 방식·계정 구분 없이 공유되던 키 */
const LEGACY_STORAGE_KEY = '@daedokdan/onboarding_profile_cache';
const STORAGE_KEY_PREFIX = '@daedokdan/onboarding_profile_cache';

export type CachedOnboardingProfile = {
  userType?: OnboardingUserType;
  reading?: ReadingProfilePayload;
  commute?: CommuteProfilePayload;
  avatarId?: string | null;
  updatedAt?: string;
};

async function resolveStorageKey(): Promise<string | null> {
  const { getAuthScopedStorageSuffix } = await import('@/src/services/auth/authService');
  const suffix = await getAuthScopedStorageSuffix();
  if (!suffix) return null;
  return `${STORAGE_KEY_PREFIX}/${suffix}`;
}

async function migrateLegacyToScoped(scopedKey: string): Promise<CachedOnboardingProfile | null> {
  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return null;
  await AsyncStorage.setItem(scopedKey, legacy);
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  try {
    return JSON.parse(legacy) as CachedOnboardingProfile;
  } catch {
    return null;
  }
}

async function readCache(): Promise<CachedOnboardingProfile | null> {
  try {
    const scopedKey = await resolveStorageKey();
    if (scopedKey) {
      let raw = await AsyncStorage.getItem(scopedKey);
      if (!raw) {
        const migrated = await migrateLegacyToScoped(scopedKey);
        if (migrated) return migrated;
        return null;
      }
      return JSON.parse(raw) as CachedOnboardingProfile;
    }

    const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return null;
    return JSON.parse(legacy) as CachedOnboardingProfile;
  } catch {
    return null;
  }
}

async function writeCache(patch: Partial<CachedOnboardingProfile>): Promise<void> {
  const scopedKey = await resolveStorageKey();
  if (!scopedKey) {
    if (__DEV__) {
      console.warn('[onboardingProfileCache] 저장 생략 — userId 없음');
    }
    return;
  }

  let prev = await readCache();
  if (!prev) {
    prev = (await migrateLegacyToScoped(scopedKey)) ?? {};
  }

  const next: CachedOnboardingProfile = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(scopedKey, JSON.stringify(next));
}

function defaultReadingSpeed(value: string | null | undefined): ReadingSpeed {
  return value === 'slow' || value === 'fast' ? value : 'normal';
}

export async function getCachedOnboardingProfile(): Promise<CachedOnboardingProfile | null> {
  return readCache();
}

export async function saveCachedOnboardingUserType(userType: OnboardingUserType): Promise<void> {
  await writeCache({ userType });
}

export async function saveCachedReadingProfile(payload: ReadingProfilePayload): Promise<void> {
  const prev = (await readCache()) ?? {};
  await writeCache({
    reading: payload,
    userType: prev.userType,
    ...(payload.avatarId ? { avatarId: payload.avatarId } : {}),
  });
}

export async function saveCachedCommuteProfile(payload: CommuteProfilePayload): Promise<void> {
  const prev = (await readCache()) ?? {};
  await writeCache({ commute: payload, userType: prev.userType });
}

/** 계정 관리 > 프로필 수정 (닉네임·아바타) */
export async function saveCachedAccountProfile(updates: {
  nickname?: string | null;
  avatarId?: string | null;
}): Promise<void> {
  const prev = (await readCache()) ?? {};
  const patch: Partial<CachedOnboardingProfile> = {};

  if (updates.avatarId !== undefined) {
    patch.avatarId = updates.avatarId;
  }

  if (updates.nickname?.trim()) {
    patch.reading = {
      nickname: updates.nickname.trim(),
      preferredGenres: prev.reading?.preferredGenres ?? [],
      readingSpeed: prev.reading?.readingSpeed ?? 'normal',
      weeklyReadCount: prev.reading?.weeklyReadCount ?? 1,
    };
  }

  if (Object.keys(patch).length > 0) {
    await writeCache({ ...patch, userType: prev.userType, commute: prev.commute });
  }
}

export async function saveCachedUserProfileSnapshot(profile: UserProfileResponse): Promise<void> {
  const prev = (await readCache()) ?? {};
  const patch: Partial<CachedOnboardingProfile> = {};

  if (profile.userType === 'worker_student' || profile.userType === 'other') {
    patch.userType = profile.userType;
  }

  if (profile.avatarId) {
    patch.avatarId = profile.avatarId;
  }

  if (profile.nickname?.trim()) {
    patch.reading = {
      nickname: profile.nickname.trim(),
      preferredGenres:
        prev.reading?.preferredGenres ??
        profile.preferredGenres ??
        [],
      readingSpeed: prev.reading?.readingSpeed ?? defaultReadingSpeed(profile.readingSpeed),
      weeklyReadCount: prev.reading?.weeklyReadCount ?? profile.weeklyReadCount ?? 1,
    };
  }

  if (Object.keys(patch).length > 0) {
    await writeCache({ ...prev, ...patch, commute: prev.commute });
  }
}

export function mergeUserProfileWithCache(
  profile: UserProfileResponse,
  cache: CachedOnboardingProfile | null,
): UserProfileResponse {
  if (!cache) return profile;

  const reading = cache.reading;

  return {
    ...profile,
    userType: cache.userType ?? profile.userType ?? null,
    nickname: reading?.nickname?.trim() || profile.nickname?.trim() || null,
    preferredGenres:
      reading?.preferredGenres && reading.preferredGenres.length > 0
        ? reading.preferredGenres
        : profile.preferredGenres && profile.preferredGenres.length > 0
          ? profile.preferredGenres
          : null,
    readingSpeed: reading?.readingSpeed ?? profile.readingSpeed ?? null,
    weeklyReadCount: reading?.weeklyReadCount ?? profile.weeklyReadCount ?? null,
    // API에 유효한 avatarId가 있으면 우선, 없으면 캐시(선택한 캐릭터) 유지
    avatarId:
      (profile.avatarId && String(profile.avatarId).trim()) ||
      cache.avatarId ||
      null,
  };
}

export async function getCachedCommuteProfile(): Promise<CommuteProfilePayload | null> {
  const cache = await readCache();
  return cache?.commute ?? null;
}

export async function clearCachedOnboardingProfile(): Promise<void> {
  const scopedKey = await resolveStorageKey();
  const keys = [LEGACY_STORAGE_KEY, ...(scopedKey ? [scopedKey] : [])];
  await AsyncStorage.multiRemove([...new Set(keys)]);
}
