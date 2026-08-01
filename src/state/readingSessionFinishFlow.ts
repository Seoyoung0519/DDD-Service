/** 독서 세션 종료 플로우(쪽수 입력 → 인증샷)에 전달 */
export type ReadingSessionFinishPayload = {
  sessionId: string;
  userId: string;
  userBookId: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  authors: string;
  sessionStartPage: number;
  sessionEndPage: number;
  plannedPages: number;
  actualMinutes: number;
  travelMinutes: number;
};

let pending: ReadingSessionFinishPayload | null = null;

export function setReadingSessionFinishPayload(payload: ReadingSessionFinishPayload): void {
  pending = payload;
}

export function consumeReadingSessionFinishPayload(): ReadingSessionFinishPayload | null {
  const out = pending;
  pending = null;
  return out;
}
