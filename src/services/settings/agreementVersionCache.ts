import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@daedokdan_last_agreement_versions_v1';

export type CachedAgreementVersions = {
  termsVersion: string;
  privacyVersion: string;
  locationTermsVersion: string;
};

export async function cacheAgreementVersions(
  input: CachedAgreementVersions,
): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(input));
}

export async function getCachedAgreementVersions(): Promise<CachedAgreementVersions | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedAgreementVersions;
    if (
      typeof parsed.termsVersion === 'string' &&
      typeof parsed.privacyVersion === 'string' &&
      typeof parsed.locationTermsVersion === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearCachedAgreementVersions(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
