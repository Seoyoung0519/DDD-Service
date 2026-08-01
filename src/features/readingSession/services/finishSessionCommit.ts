import { finishReadingSessionApi } from '@/src/features/readingSession/services/readingSessionApi';
import type { ReadingSessionFinishPayload } from '@/src/state/readingSessionFinishFlow';
import { notifyReadingRecordSaved, notifyReadingSessionFinish } from '@/src/services/push/pushNotificationService';
import { resetProximityNotificationCache } from '@/src/features/readingSession/services/notificationService';

export async function commitFinishReadingSession(
  payload: ReadingSessionFinishPayload,
  endPage: number,
): Promise<void> {
  const safeEndPage = Math.max(payload.sessionStartPage, Math.round(endPage));
  const actualMinutes = payload.actualMinutes;

  try {
    if (payload.sessionId.startsWith('demo-session-')) {
      const pagesRead = Math.max(0, safeEndPage - payload.sessionStartPage + 1);
      await notifyReadingSessionFinish(pagesRead);
      await notifyReadingRecordSaved();
    } else {
      const result = await finishReadingSessionApi({
        sessionId: payload.sessionId,
        userId: payload.userId,
        endPage: safeEndPage,
        actualMinutes,
      });
      const pagesRead =
        result.actualPages ?? Math.max(0, safeEndPage - payload.sessionStartPage + 1);
      await notifyReadingSessionFinish(pagesRead);
      await notifyReadingRecordSaved();
    }
  } finally {
    resetProximityNotificationCache();
  }
}
