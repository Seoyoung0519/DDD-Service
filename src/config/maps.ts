import Constants from 'expo-constants';

/** Android Google Maps / iOS Maps SDK 키 (Expo prebuild 시 AndroidManifest·Info.plist에 주입) */
export function getGoogleMapsApiKey(): string {
  const fromEnv = String(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
  if (fromEnv) return fromEnv;

  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey;
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim();

  const androidKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  if (typeof androidKey === 'string' && androidKey.trim()) return androidKey.trim();

  const iosKey = Constants.expoConfig?.ios?.config?.googleMapsApiKey;
  if (typeof iosKey === 'string' && iosKey.trim()) return iosKey.trim();

  return '';
}

export function hasGoogleMapsApiKey(): boolean {
  return getGoogleMapsApiKey().length > 0;
}
