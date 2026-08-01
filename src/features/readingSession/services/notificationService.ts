/**
 * 독서 세션 중 환승·도착 안내 — 앱 내 UI + 기기 로컬 알림(COMMUTE_ALERT).
 * 세션 종료·책 추천은 `deviceNotificationService`의 다른 kind로 처리합니다.
 */

export type InAppProximityAlert = {
  title: string;
  body: string;
};

const proximityNotifiedKeys = new Set<string>();

export function shouldNotifyProximity(key: string): boolean {
  if (proximityNotifiedKeys.has(key)) return false;
  proximityNotifiedKeys.add(key);
  return true;
}

export function resetProximityNotificationCache(): void {
  proximityNotifiedKeys.clear();
}
