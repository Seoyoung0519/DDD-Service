/**
 * 통근 분량 추천으로 ReadingSession_1에 들어갈 때
 * 읽을 책 PICK을 한 번만 숨긴다. URL 파라미터는 스택 재사용 시 갱신이 안 될 수 있음.
 */
let hidePickOnce = false;

export function hideReadingPickModalOnce(): void {
  hidePickOnce = true;
}

export function consumeHideReadingPickModalOnce(): boolean {
  const next = hidePickOnce;
  hidePickOnce = false;
  return next;
}
