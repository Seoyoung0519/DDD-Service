import type { ReadingSpeed } from '@/src/services/onboarding/onboardingService';
import { ONBOARDING_READING_TEST_STORAGE_KEY } from '@/src/services/onboarding/onboardingService';

import type { Router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getUserProfile } from '@/src/api/userProfile';

export const READING_TEST_RETAKE_BLOCKED_MESSAGE =
  '독서 속도 테스트는 온보딩 수정에서 다시 진행할 수 없습니다.';

export function isOnboardingEditMode(edit: string | string[] | undefined): boolean {
  const value = Array.isArray(edit) ? edit[0] : edit;
  return value === '1' || value === 'true';
}

export function mapUserTypeFromProfile(userType: string | null | undefined): 'worker_student' | 'other' {
  return userType === 'other' ? 'other' : 'worker_student';
}

export function mapReadingSpeedToUi(speed: string | null | undefined): 1 | 2 | 3 | 4 | 5 {
  if (speed === 'slow') return 2;
  if (speed === 'fast') return 4;
  return 3;
}

export function mapWeeklyCountToFreq(
  count: number | null | undefined,
): 'monthly' | 'weekly_low' | 'weekly_mid' | 'daily' | null {
  if (count == null || !Number.isFinite(count)) return null;
  if (count >= 6) return 'daily';
  if (count >= 3) return 'weekly_mid';
  if (count === 2) return 'weekly_low';
  return 'monthly';
}

export function mapUiSpeedToApi(speed: 1 | 2 | 3 | 4 | 5): ReadingSpeed {
  if (speed <= 2) return 'slow';
  if (speed === 3) return 'normal';
  return 'fast';
}

type ReadingTestGate = 'loading' | 'allowed' | 'blocked';

/**
 * 온보딩 완료 사용자의 독서 속도 테스트 **재시작** 차단.
 * 진행 중 테스트(스토리지에 start 응답)가 있으면 허용 — finish 후 isOnboarded여도 결과 화면 진입은 별도 처리.
 */
export function useOnboardingReadingTestGate(router: Router): ReadingTestGate {
  const [gate, setGate] = useState<ReadingTestGate>('loading');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const inProgress = await AsyncStorage.getItem(ONBOARDING_READING_TEST_STORAGE_KEY);
        if (cancelled) return;
        if (inProgress) {
          setGate('allowed');
          return;
        }

        const profile = await getUserProfile();
        if (cancelled) return;

        if (profile.isOnboarded) {
          setGate('blocked');
          Alert.alert('안내', READING_TEST_RETAKE_BLOCKED_MESSAGE, [
            { text: '확인', onPress: () => router.back() },
          ]);
          return;
        }

        setGate('allowed');
      } catch {
        if (!cancelled) setGate('allowed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return gate;
}
