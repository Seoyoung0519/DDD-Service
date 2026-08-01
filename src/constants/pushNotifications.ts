/** 기기(시스템) 알림으로 보내는 종류 */
export const DEVICE_NOTIFICATION_KIND = {
  SESSION_FINISH: 'SESSION_FINISH',
  RECORD_SAVE: 'RECORD_SAVE',
  BOOK_RECOMMENDATION: 'BOOK_RECOMMENDATION',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  /** 독서 세션 중 환승·도착 근접 — 기기 알림만, 알림함에는 저장하지 않음 */
  COMMUTE_ALERT: 'COMMUTE_ALERT',
} as const;

/** 앱 알림 아이콘(알림함)에 저장되는 종류 */
export const INBOX_NOTIFICATION_KINDS = [
  DEVICE_NOTIFICATION_KIND.SESSION_FINISH,
  DEVICE_NOTIFICATION_KIND.RECORD_SAVE,
  DEVICE_NOTIFICATION_KIND.BOOK_RECOMMENDATION,
  DEVICE_NOTIFICATION_KIND.ANNOUNCEMENT,
] as const;

export type InboxNotificationKind = (typeof INBOX_NOTIFICATION_KINDS)[number];

export const DEVICE_NOTIFICATION_CHANNEL = {
  SESSION_FINISH: 'session-finish',
  RECORD_SAVE: 'record-save',
  BOOK_RECOMMENDATION: 'book-recommendation',
  ANNOUNCEMENT: 'announcement',
  COMMUTE_ALERT: 'commute-alert',
} as const;

export const COMMUTE_ALERT_NOTIFICATION = {
  walkTitle: '도보 이동 안내',
  transferTitle: '환승 안내',
  destinationTitle: '도착 안내',
} as const;

/** 직장인 출퇴근 기준 책 추천 기기 알림 스케줄 */
export const BOOK_RECOMMENDATION_SCHEDULES = [
  { id: 'book-rec-morning', hour: 8, minute: 0 },
  { id: 'book-rec-evening', hour: 18, minute: 30 },
] as const;

export const BOOK_RECOMMENDATION_NOTIFICATION = {
  title: '오늘의 책 추천',
  body: '오늘 출퇴근길에 읽기 좋은 책을 추천드려요!',
} as const;

export const SESSION_FINISH_NOTIFICATION = {
  title: '독서 세션 완료',
  bodySuffix: '페이지 읽었어요! 🎉',
} as const;

export const RECORD_SAVE_NOTIFICATION = {
  title: '독서 기록 저장',
  body: '독서 기록이 저장되었습니다 📚',
} as const;

export const ANNOUNCEMENT_NOTIFICATION = {
  title: '공지사항',
  body: '새로운 기능이 업데이트되었습니다!',
} as const;
