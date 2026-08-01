import { Alert, Linking, Platform } from 'react-native';

import type { LatLng } from '@/src/features/readingSession/types/readingSession.types';

export type LocationPermissionResult = {
  ok: boolean;
  foregroundGranted: boolean;
  backgroundGranted: boolean;
  message?: string;
};

type LocationModule = typeof import('expo-location');
type LocationSubscription = import('expo-location').LocationSubscription;

let locationModulePromise: Promise<LocationModule> | null = null;

async function getLocationModule(): Promise<LocationModule> {
  if (!locationModulePromise) {
    locationModulePromise = import('expo-location');
  }
  return locationModulePromise;
}

const LOCATION_WATCH_OPTIONS = {
  accuracy: 4 as const, // Location.Accuracy.Balanced
  timeInterval: 5_000,
  distanceInterval: 15,
};

export async function requestLocationPermissions(): Promise<LocationPermissionResult> {
  const Location = await getLocationModule();
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  const foregroundGranted = foregroundStatus === 'granted';

  let backgroundGranted = false;
  if (foregroundGranted) {
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    backgroundGranted = backgroundStatus === 'granted';
  }

  if (!foregroundGranted) {
    return {
      ok: false,
      foregroundGranted: false,
      backgroundGranted: false,
      message:
        '위치 권한이 필요합니다. 설정에서 위치 접근을 허용해 주세요. 독서 세션 중 환승·도착 안내를 지도 화면에서 확인할 수 있습니다.',
    };
  }

  return {
    ok: true,
    foregroundGranted: true,
    backgroundGranted,
    message: backgroundGranted
      ? undefined
      : '백그라운드 위치 권한이 없어 앱을 닫으면 위치 추적이 중단될 수 있습니다.',
  };
}

export function showLocationPermissionAlert(message: string) {
  Alert.alert('위치 권한', message, [
    { text: '취소', style: 'cancel' },
    {
      text: '설정 열기',
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
}

export async function getCurrentPosition(): Promise<LatLng> {
  const Location = await getLocationModule();
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

export async function startLocationWatch(
  onUpdate: (location: LatLng) => void,
): Promise<LocationSubscription> {
  const Location = await getLocationModule();

  if (Platform.OS === 'android') {
    await Location.enableNetworkProviderAsync().catch(() => undefined);
  }

  const initial = await getCurrentPosition().catch(() => null);
  if (initial) onUpdate(initial);

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: LOCATION_WATCH_OPTIONS.timeInterval,
      distanceInterval: LOCATION_WATCH_OPTIONS.distanceInterval,
    },
    (position) => {
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
  );
}

export async function stopLocationWatch(
  subscription: LocationSubscription | null | undefined,
): Promise<void> {
  subscription?.remove();
}
