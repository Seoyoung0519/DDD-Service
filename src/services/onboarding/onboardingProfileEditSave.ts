import { updateUserProfile } from '@/src/api/userProfile';

import {
  saveCachedCommuteProfile,
  saveCachedOnboardingUserType,
  saveCachedReadingProfile,
} from './onboardingProfileCache';
import {
  setOnboardingUserType,
  submitCommuteProfile,
  submitReadingProfile,
  type CommuteProfilePayload,
  type ReadingProfilePayload,
  type SetUserTypePayload,
} from './onboardingService';

export function isOnboardingAlreadyCompleteError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    /already onboarded/.test(m) ||
    /onboarding.*complete/.test(m) ||
    /already completed/.test(m) ||
    /is onboarded/.test(m) ||
    /이미.*온보딩/.test(message) ||
    /온보딩.*완료/.test(message)
  );
}

export async function saveOnboardingUserTypeForEdit(payload: SetUserTypePayload): Promise<void> {
  try {
    await setOnboardingUserType(payload);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!isOnboardingAlreadyCompleteError(msg)) throw e;
  } finally {
    await saveCachedOnboardingUserType(payload.userType);
  }
}

export async function saveReadingProfileForEdit(payload: ReadingProfilePayload): Promise<void> {
  try {
    await submitReadingProfile(payload);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!isOnboardingAlreadyCompleteError(msg)) throw e;
    try {
      await updateUserProfile({
        nickname: payload.nickname,
        ...(payload.avatarId ? { avatarId: payload.avatarId } : {}),
      });
    } catch {
      // 닉네임 PATCH 실패해도 로컬·캐시 저장은 유지
    }
  } finally {
    await saveCachedReadingProfile(payload);
  }
}

export async function saveCommuteProfileForEdit(payload: CommuteProfilePayload): Promise<void> {
  try {
    await submitCommuteProfile(payload);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!isOnboardingAlreadyCompleteError(msg)) throw e;
  } finally {
    await saveCachedCommuteProfile(payload);
  }
}
