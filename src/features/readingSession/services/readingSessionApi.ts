import { finishReadingSession, type ReadingSession } from '@/src/api/readingSession';
import type { FinishReadingSessionRequest } from '@/src/features/readingSession/types/readingSession.types';

export async function finishReadingSessionApi(
  payload: FinishReadingSessionRequest,
): Promise<ReadingSession> {
  return finishReadingSession(payload.sessionId, {
    user_id: payload.userId,
    end_page: payload.endPage,
    actual_minutes: payload.actualMinutes,
  });
}
