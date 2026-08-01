import type { Href } from 'expo-router';

import { fetchAgreements, SettingsApiError } from '@/src/api/settings';
import {
  markOnboardingAgreementPending,
  type OnboardingAgreementNextRoute,
} from '@/src/services/onboarding/onboardingSkip';

/**
 * 필수 약관(이용약관·개인정보·위치) 동의 이력이 서버에 있는지 확인합니다.
 * - 404 / 이력 없음 → false
 * - 네트워크·5xx → true (일시 장애로 앱이 멈기지 않도록)
 */
export async function hasRequiredAgreements(): Promise<boolean> {
  try {
    const agreement = await fetchAgreements();
    return Boolean(
      agreement.termsVersion?.trim() &&
        agreement.privacyVersion?.trim() &&
        agreement.locationTermsVersion?.trim(),
    );
  } catch (error) {
    if (error instanceof SettingsApiError) {
      if (error.status === 404) return false;
      if (error.status === 0 || error.status >= 500) {
        console.warn('[agreementGate] 약관 조회 일시 실패 — 게이트 생략', error.message);
        return true;
      }
    }
    console.warn('[agreementGate] 약관 조회 실패 — 미동의로 처리', error);
    return false;
  }
}

export function agreementsScreenHref(next: OnboardingAgreementNextRoute): Href {
  return {
    pathname: '/OnboardingAgreementsScreen',
    params: { next },
  };
}

/** 약관 미동의면 동의 화면 Href를 반환하고, 동의가 있으면 null */
export async function resolveAgreementsGateRoute(
  next: OnboardingAgreementNextRoute,
): Promise<Href | null> {
  if (await hasRequiredAgreements()) return null;
  await markOnboardingAgreementPending(next);
  return agreementsScreenHref(next);
}
