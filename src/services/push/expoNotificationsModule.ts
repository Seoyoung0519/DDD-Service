import { Platform } from 'react-native';

export type ExpoNotificationsModule = typeof import('expo-notifications');

let cachedModule: ExpoNotificationsModule | null | undefined;

/** dynamic import() 대신 require — 저장·로그인 중 lazy 번들/HMR 오류 방지 */
export function getExpoNotificationsModule(): ExpoNotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-notifications') as ExpoNotificationsModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}
