import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGACY_ONBOARDING_SKIPPED_KEY = '@daedokdan_onboarding_skipped';
const ONBOARDING_SKIPPED_PREFIX = '@daedokdan_onboarding_skipped';
const AGREEMENT_PENDING_PREFIX = '@daedokdan_onboarding_agreement_pending';

export type OnboardingAgreementNextRoute =
  | 'onboarding'
  | 'DaedokPick'
  | 'Drawer_1'
  | 'Onboarding_8';

const AGREEMENT_NEXT_ROUTES: ReadonlySet<string> = new Set([
  'onboarding',
  'DaedokPick',
  'Drawer_1',
  'Onboarding_8',
]);

export function parseOnboardingAgreementNextRoute(
  value: string | null | undefined,
): OnboardingAgreementNextRoute | null {
  if (!value) return null;
  return AGREEMENT_NEXT_ROUTES.has(value) ? (value as OnboardingAgreementNextRoute) : null;
}

async function resolveSkipKey(): Promise<string | null> {
  const { getAuthScopedStorageSuffix } = await import('@/src/services/auth/authService');
  const suffix = await getAuthScopedStorageSuffix();
  if (!suffix) return null;
  return `${ONBOARDING_SKIPPED_PREFIX}/${suffix}`;
}

export async function markOnboardingSkipped(): Promise<void> {
  const key = await resolveSkipKey();
  if (!key) return;
  await AsyncStorage.setItem(key, '1');
}

export async function isOnboardingSkipped(): Promise<boolean> {
  const key = await resolveSkipKey();
  if (key) {
    const v = await AsyncStorage.getItem(key);
    return v === '1';
  }
  const legacy = await AsyncStorage.getItem(LEGACY_ONBOARDING_SKIPPED_KEY);
  return legacy === '1';
}

export async function clearOnboardingSkipped(): Promise<void> {
  const key = await resolveSkipKey();
  if (key) {
    await AsyncStorage.removeItem(key);
  }
  await AsyncStorage.removeItem(LEGACY_ONBOARDING_SKIPPED_KEY);
}

async function resolveAgreementPendingKey(): Promise<string | null> {
  const { getAuthScopedStorageSuffix } = await import('@/src/services/auth/authService');
  const suffix = await getAuthScopedStorageSuffix();
  if (!suffix) return null;
  return `${AGREEMENT_PENDING_PREFIX}/${suffix}`;
}

export async function markOnboardingAgreementPending(
  nextRoute: OnboardingAgreementNextRoute,
): Promise<void> {
  const key = await resolveAgreementPendingKey();
  if (!key) return;
  await AsyncStorage.setItem(key, nextRoute);
}

export async function getOnboardingAgreementPendingRoute(): Promise<OnboardingAgreementNextRoute | null> {
  const key = await resolveAgreementPendingKey();
  if (!key) return null;
  const value = await AsyncStorage.getItem(key);
  return parseOnboardingAgreementNextRoute(value);
}

export async function clearOnboardingAgreementPending(): Promise<void> {
  const key = await resolveAgreementPendingKey();
  if (key) await AsyncStorage.removeItem(key);
}
