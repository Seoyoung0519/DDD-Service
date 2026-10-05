import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import { Platform } from 'react-native';

import type { OnboardingAgreementNextRoute } from '@/src/services/onboarding/onboardingSkip';

/** 공개 문구를 바꾸면 재노출을 위해 버전을 올립니다. */
export const DEVICE_PERMISSIONS_DISCLOSURE_VERSION = '1';

const STORAGE_PREFIX = '@daedokdan_device_permissions_disclosure';

function onboardingNextToPath(next: OnboardingAgreementNextRoute): string {
  switch (next) {
    case 'DaedokPick':
      return '/DaedokPick';
    case 'Drawer_1':
      return '/Drawer_1';
    case 'Onboarding_8':
      return '/Onboarding_8';
    case 'onboarding':
    default:
      return '/onboarding';
  }
}

async function resolveStorageKey(): Promise<string | null> {
  const { getAuthScopedStorageSuffix } = await import('@/src/services/auth/authService');
  const suffix = await getAuthScopedStorageSuffix();
  if (!suffix) return null;
  return `${STORAGE_PREFIX}/${DEVICE_PERMISSIONS_DISCLOSURE_VERSION}/${suffix}`;
}

export function hrefToPath(route: Href): string {
  if (typeof route === 'string') return route;
  const pathname = route.pathname ?? '/';
  if (!route.params || typeof route.params !== 'object') return pathname;
  const query = Object.entries(route.params)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `${pathname}?${query}` : pathname;
}

export function devicePermissionsDisclosureHref(nextPath: string): Href {
  return {
    pathname: '/DevicePermissionsDisclosureScreen',
    params: { next: nextPath },
  } as Href;
}

export async function hasCompletedDevicePermissionsDisclosure(): Promise<boolean> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return true;
  const key = await resolveStorageKey();
  if (!key) return false;
  const value = await AsyncStorage.getItem(key);
  return value === '1';
}

export async function markDevicePermissionsDisclosureCompleted(): Promise<void> {
  const key = await resolveStorageKey();
  if (!key) return;
  await AsyncStorage.setItem(key, '1');
}

export async function resolveDevicePermissionsDisclosureRoute(
  next: OnboardingAgreementNextRoute,
): Promise<Href | null> {
  if (await hasCompletedDevicePermissionsDisclosure()) return null;
  return devicePermissionsDisclosureHref(onboardingNextToPath(next));
}

export async function applyDevicePermissionsDisclosureGate(route: Href): Promise<Href> {
  if (await hasCompletedDevicePermissionsDisclosure()) return route;
  return devicePermissionsDisclosureHref(hrefToPath(route));
}
