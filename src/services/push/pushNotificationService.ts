import { savePushToken } from '@/src/api/push';
import { AuthSessionExpiredError, fetchCurrentUser, getAccessToken } from '@/src/services/auth/authService';
import {
  getDevicePushToken,
  getInboxNotificationKindFromContent,
  isDeviceNotificationSupported,
  notifyReadingRecordSavedOnDevice,
  notifyReadingSessionFinishOnDevice,
  presentDeviceNotification,
  scheduleBookRecommendationDeviceNotifications,
} from '@/src/services/push/deviceNotificationService';
import { getExpoNotificationsModule } from '@/src/services/push/expoNotificationsModule';
import {
  addNotificationToInbox,
  type InboxNotification,
} from '@/src/services/push/notificationInbox';
import {
  ANNOUNCEMENT_NOTIFICATION,
  DEVICE_NOTIFICATION_KIND,
  RECORD_SAVE_NOTIFICATION,
  SESSION_FINISH_NOTIFICATION,
} from '@/src/constants/pushNotifications';

let initPromise: Promise<void> | null = null;
let listenersAttached = false;

function attachAllowedDeviceNotificationListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  void (async () => {
    if (!(await isDeviceNotificationSupported())) return;

    const Notifications = getExpoNotificationsModule();
    if (!Notifications) return;

    if (
      typeof Notifications.addNotificationReceivedListener !== 'function' ||
      typeof Notifications.addNotificationResponseReceivedListener !== 'function'
    ) {
      return;
    }

    const recordIfAllowed = (content: {
      title?: string | null;
      body?: string | null;
      data?: Record<string, unknown>;
    }) => {
      if (content.data?.inboxSkip === true) return;
      if (!getInboxNotificationKindFromContent(content)) return;
      void addNotificationToInbox({
        title: content.title ?? '알림',
        body: content.body ?? '',
      });
    };

    Notifications.addNotificationReceivedListener((notification) => {
      recordIfAllowed(notification.request.content);
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      recordIfAllowed(response.notification.request.content);
    });
  })();
}

async function registerDevicePushToken(userId: string): Promise<void> {
  const token = await getDevicePushToken();
  if (!token) return;
  await savePushToken({ userId, token });
  if (__DEV__) console.log('[push] FCM 토큰 저장 완료');
}

/**
 * 로그인·세션 복원 후 — FCM 토큰 등록 + 출퇴근 책 추천 기기 알림 스케줄
 */
export async function initializePushNotifications(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      let userId: string;
      try {
        const user = await fetchCurrentUser();
        userId = user.id;
      } catch (e) {
        if (e instanceof AuthSessionExpiredError) return;
        if (__DEV__) console.warn('[push] 사용자 정보 없음 — 푸시 초기화 생략');
        return;
      }

      attachAllowedDeviceNotificationListeners();
      await registerDevicePushToken(userId);
      await scheduleBookRecommendationDeviceNotifications();
    } catch (e) {
      initPromise = null;
      if (__DEV__) console.warn('[push] 초기화 실패:', e);
    }
  })();

  return initPromise;
}

/** 세션 종료(5-1) — finish API 직후, 기기 알림 + 알림함 */
export async function notifyReadingSessionFinish(actualPages: number): Promise<InboxNotification> {
  const body = `오늘 ${actualPages}${SESSION_FINISH_NOTIFICATION.bodySuffix}`;
  await notifyReadingSessionFinishOnDevice(actualPages);
  return addNotificationToInbox({
    title: SESSION_FINISH_NOTIFICATION.title,
    body,
  });
}

/** 기록 저장(5-2) — DB 저장 완료 후, 기기 알림 + 알림함 */
export async function notifyReadingRecordSaved(): Promise<InboxNotification> {
  await notifyReadingRecordSavedOnDevice();
  return addNotificationToInbox({
    title: RECORD_SAVE_NOTIFICATION.title,
    body: RECORD_SAVE_NOTIFICATION.body,
  });
}

/** 공지사항(5-4) — 관리자 공지 등록 시 */
export async function notifyAnnouncement(
  body: string = ANNOUNCEMENT_NOTIFICATION.body,
): Promise<InboxNotification> {
  await presentDeviceNotification({
    kind: DEVICE_NOTIFICATION_KIND.ANNOUNCEMENT,
    title: ANNOUNCEMENT_NOTIFICATION.title,
    body,
    identifier: `announcement-${Date.now()}`,
    skipInboxListener: true,
  });
  return addNotificationToInbox({
    title: ANNOUNCEMENT_NOTIFICATION.title,
    body,
  });
}
