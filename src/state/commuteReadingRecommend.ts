/**
 * `CommuteReadingRecommendScreen`으로 전달.
 * 분량 추천 API는 화면 진입 후 호출 — `availableMinutes` 등은 경로 선택 결과에서 전달.
 */
export type CommuteReadingRecommendPayload = {
  userId: string;
  bookId: string;
  userBookId: string;
  originPlaceId: string;
  destinationPlaceId: string;
  selectedRouteId: string;
  /** 선택한 경로 총 이동 시간(분) — 산정 전 UI 표시용 */
  availableMinutes: number;
  /** 출발/도착 좌표 — 읽기 세션 시작 시 `origin_lat` 등으로 전달 */
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
};

let pending: CommuteReadingRecommendPayload | null = null;

export function setCommuteReadingRecommend(payload: CommuteReadingRecommendPayload) {
  pending = payload;
}

export function consumeCommuteReadingRecommend(): CommuteReadingRecommendPayload | null {
  const out = pending;
  pending = null;
  return out;
}

/** 분량 추천 모달을 띄울지 — `consume` 전에만 사용 */
export function hasPendingCommuteReadingRecommend(): boolean {
  return pending != null;
}
