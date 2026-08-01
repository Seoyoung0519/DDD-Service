import { Platform } from 'react-native';

import {
  BOOK_RECOMMENDATION_NOTIFICATION,
  BOOK_RECOMMENDATION_SCHEDULES,
  COMMUTE_ALERT_NOTIFICATION,
  DEVICE_NOTIFICATION_CHANNEL,
  DEVICE_NOTIFICATION_KIND,
  INBOX_NOTIFICATION_KINDS,
  type InboxNotificationKind,
  SESSION_FINISH_NOTIFICATION,
  RECORD_SAVE_NOTIFICATION,
} from '@/src/constants/pushNotifications';
import {
  getExpoNotificationsModule,
  type ExpoNotificationsModule,
} from '@/src/services/push/expoNotificationsModule';

export type DeviceNotificationKind =
  (typeof DEVICE_NOTIFICATION_KIND)[keyof typeof DEVICE_NOTIFICATION_KIND];

type NotificationsModule = ExpoNotificationsModule;

let modulePromise: Promise<NotificationsModule | null> | null = null;
let handlerConfigured = false;
let moduleUnavailable = false;

function areDeviceNotificationsAvailable(
  Notifications: NotificationsModule | null | undefined,
): Notifications is NotificationsModule {
  return (
    Platform.OS !== 'web' &&
    Notifications != null &&
    typeof Notifications.setNotificationHandler === 'function' &&
    typeof Notifications.getPermissionsAsync === 'function' &&
    typeof Notifications.scheduleNotificationAsync === 'function'
  );
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (moduleUnavailable) return null;
  if (!modulePromise) {
    modulePromise = Promise.resolve().then(() => {
      if (Platform.OS === 'web') {
        moduleUnavailable = true;
        return null;
      }
      const mod = getExpoNotificationsModule();
      if (!areDeviceNotificationsAvailable(mod)) {
        moduleUnavailable = true;
        if (__DEV__) {
          console.warn(
            '[deviceNotification] expo-notifications 네이티브 모듈 없음 — 기기 알림을 생략합니다.',
          );
        }
        return null;
      }
      return mod;
    });
  }
  return modulePromise;
}

/** iOS/Android 네이티브에서 기기 알림 API 사용 가능 여부 */
export async function isDeviceNotificationSupported(): Promise<boolean> {
  const mod = await getNotificationsModule();
  return areDeviceNotificationsAvailable(mod);
}

export function isAllowedDeviceNotificationKind(value: unknown): value is DeviceNotificationKind {
  return (
    value === DEVICE_NOTIFICATION_KIND.SESSION_FINISH ||
    value === DEVICE_NOTIFICATION_KIND.RECORD_SAVE ||
    value === DEVICE_NOTIFICATION_KIND.BOOK_RECOMMENDATION ||
    value === DEVICE_NOTIFICATION_KIND.ANNOUNCEMENT ||
    value === DEVICE_NOTIFICATION_KIND.COMMUTE_ALERT
  );
}

export function isInboxNotificationKind(value: unknown): value is InboxNotificationKind {
  return INBOX_NOTIFICATION_KINDS.includes(value as InboxNotificationKind);
}

export function getNotificationKindFromContent(
  content: { data?: Record<string, unknown> } | null | undefined,
): DeviceNotificationKind | null {
  const kind = content?.data?.kind;
  return isAllowedDeviceNotificationKind(kind) ? kind : null;
}

export function getInboxNotificationKindFromContent(
  content: { data?: Record<string, unknown> } | null | undefined,
): InboxNotificationKind | null {
  const kind = getNotificationKindFromContent(content);
  return kind && isInboxNotificationKind(kind) ? kind : null;
}

async function ensureNotificationHandler(Notifications: NotificationsModule | null): Promise<boolean> {
  if (!areDeviceNotificationsAvailable(Notifications)) return false;
  if (handlerConfigured) return true;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const kind = getNotificationKindFromContent(notification.request.content);
      const show = kind != null;
      return {
        shouldShowAlert: show,
        shouldPlaySound: show,
        shouldSetBadge: false,
        shouldShowBanner: show,
        shouldShowList: show,
      };
    },
  });
  handlerConfigured = true;
  return true;
}

async function ensureAndroidChannels(Notifications: NotificationsModule | null): Promise<void> {
  if (!areDeviceNotificationsAvailable(Notifications) || Platform.OS !== 'android') return;
  if (typeof Notifications.setNotificationChannelAsync !== 'function') return;
  await Notifications.setNotificationChannelAsync(DEVICE_NOTIFICATION_CHANNEL.SESSION_FINISH, {
    name: '독서 세션 완료',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
  await Notifications.setNotificationChannelAsync(DEVICE_NOTIFICATION_CHANNEL.RECORD_SAVE, {
    name: '독서 기록 저장',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(DEVICE_NOTIFICATION_CHANNEL.BOOK_RECOMMENDATION, {
    name: '출퇴근 책 추천',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(DEVICE_NOTIFICATION_CHANNEL.ANNOUNCEMENT, {
    name: '공지사항',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(DEVICE_NOTIFICATION_CHANNEL.COMMUTE_ALERT, {
    name: '통근 이동 안내',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
  });
}

function channelIdForKind(kind: DeviceNotificationKind): string | undefined {
  if (Platform.OS !== 'android') return undefined;
  if (kind === DEVICE_NOTIFICATION_KIND.SESSION_FINISH) {
    return DEVICE_NOTIFICATION_CHANNEL.SESSION_FINISH;
  }
  if (kind === DEVICE_NOTIFICATION_KIND.RECORD_SAVE) {
    return DEVICE_NOTIFICATION_CHANNEL.RECORD_SAVE;
  }
  if (kind === DEVICE_NOTIFICATION_KIND.ANNOUNCEMENT) {
    return DEVICE_NOTIFICATION_CHANNEL.ANNOUNCEMENT;
  }
  if (kind === DEVICE_NOTIFICATION_KIND.COMMUTE_ALERT) {
    return DEVICE_NOTIFICATION_CHANNEL.COMMUTE_ALERT;
  }
  return DEVICE_NOTIFICATION_CHANNEL.BOOK_RECOMMENDATION;
}

/** 기기(시스템) 알림 권한 — 세션 종료·책 추천용 */
export async function requestDeviceNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!(await ensureNotificationHandler(Notifications))) return false;
  if (!areDeviceNotificationsAvailable(Notifications)) return false;
  await ensureAndroidChannels(Notifications);

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

/**
 * 허용된 종류만 기기 알림 표시
 * - SESSION_FINISH / RECORD_SAVE / BOOK_RECOMMENDATION / ANNOUNCEMENT: 알림함 저장 대상
 * - COMMUTE_ALERT: 통근 환승·도착 근접 (기기 알림만)
 */
export async function presentDeviceNotification(input: {
  kind: DeviceNotificationKind;
  title: string;
  body: string;
  identifier?: string;
  /** true면 수신 리스너가 알림함에 중복 저장하지 않음 */
  skipInboxListener?: boolean;
}): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!areDeviceNotificationsAvailable(Notifications)) return;
  if (!(await ensureNotificationHandler(Notifications))) return;
  await ensureAndroidChannels(Notifications);

  const granted = await requestDeviceNotificationPermission();
  if (!granted) {
    if (__DEV__) console.warn('[deviceNotification] 권한 없음 — 기기 알림 생략:', input.kind);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: input.identifier,
    content: {
      title: input.title,
      body: input.body,
      sound: true,
      data: {
        kind: input.kind,
        ...(input.skipInboxListener ? { inboxSkip: true } : {}),
      },
      ...(Platform.OS === 'android' ? { channelId: channelIdForKind(input.kind) } : {}),
    },
    trigger: null,
  });
}

/** 매일 08:00 · 18:30 출퇴근 책 추천 기기 알림 */
export async function scheduleBookRecommendationDeviceNotifications(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!areDeviceNotificationsAvailable(Notifications)) return;
  if (!(await ensureNotificationHandler(Notifications))) return;
  await ensureAndroidChannels(Notifications);

  const granted = await requestDeviceNotificationPermission();
  if (!granted) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of scheduled) {
    if (item.identifier.startsWith('book-rec-')) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }

  for (const slot of BOOK_RECOMMENDATION_SCHEDULES) {
    await Notifications.scheduleNotificationAsync({
      identifier: slot.id,
      content: {
        title: BOOK_RECOMMENDATION_NOTIFICATION.title,
        body: BOOK_RECOMMENDATION_NOTIFICATION.body,
        sound: true,
        data: { kind: DEVICE_NOTIFICATION_KIND.BOOK_RECOMMENDATION },
        ...(Platform.OS === 'android'
          ? { channelId: DEVICE_NOTIFICATION_CHANNEL.BOOK_RECOMMENDATION }
          : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: slot.hour,
        minute: slot.minute,
      },
    });
  }
}

/** 독서 세션 중 환승·도착 지점 근접 시 기기 로컬 알림 */
export async function notifyCommuteProximityOnDevice(input: {
  kind: 'WALK' | 'TRANSFER' | 'DESTINATION';
  body: string;
  pointId: string;
}): Promise<void> {
  const title =
    input.kind === 'WALK'
      ? COMMUTE_ALERT_NOTIFICATION.walkTitle
      : input.kind === 'TRANSFER'
        ? COMMUTE_ALERT_NOTIFICATION.transferTitle
        : COMMUTE_ALERT_NOTIFICATION.destinationTitle;

  await presentDeviceNotification({
    kind: DEVICE_NOTIFICATION_KIND.COMMUTE_ALERT,
    title,
    body: input.body,
    identifier: `commute-alert-${input.pointId}`,
  });
}

export async function notifyReadingSessionFinishOnDevice(actualPages: number): Promise<void> {
  const body = `오늘 ${actualPages}${SESSION_FINISH_NOTIFICATION.bodySuffix}`;
  await presentDeviceNotification({
    kind: DEVICE_NOTIFICATION_KIND.SESSION_FINISH,
    title: SESSION_FINISH_NOTIFICATION.title,
    body,
    identifier: `session-finish-${Date.now()}`,
    skipInboxListener: true,
  });
}

export async function notifyReadingRecordSavedOnDevice(): Promise<void> {
  await presentDeviceNotification({
    kind: DEVICE_NOTIFICATION_KIND.RECORD_SAVE,
    title: RECORD_SAVE_NOTIFICATION.title,
    body: RECORD_SAVE_NOTIFICATION.body,
    identifier: `record-save-${Date.now()}`,
    skipInboxListener: true,
  });
}

export async function cancelAllScheduledDeviceNotifications(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!areDeviceNotificationsAvailable(Notifications)) return;
  if (typeof Notifications.cancelAllScheduledNotificationsAsync !== 'function') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getDevicePushToken(): Promise<string | null> {
  const Notifications = await getNotificationsModule();
  if (!areDeviceNotificationsAvailable(Notifications)) return null;
  await ensureAndroidChannels(Notifications);
  const granted = await requestDeviceNotificationPermission();
  if (!granted) return null;

  if (typeof Notifications.getDevicePushTokenAsync !== 'function') return null;

  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    return typeof deviceToken.data === 'string' ? deviceToken.data : null;
  } catch {
    return null;
  }
}
