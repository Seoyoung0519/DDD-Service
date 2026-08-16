/**
 * `CommuteReadingRecommendScreen`으로 전달.
 * 분량 추천 API는 화면 진입 후 호출 — `availableMinutes` 등은 경로 선택 결과에서 전달.
 */
import type { CurrentReadingItem } from '@/src/types/reading';

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
  /** 경로 조회 스킵·데모 플로우 — 분량 추천 mock에 사용 */
  demoBook?: Pick<
    CurrentReadingItem,
    'userBookId' | 'bookId' | 'title' | 'authors' | 'coverUrl' | 'currentPage' | 'pageCount'
  >;
};

let pending: CommuteReadingRecommendPayload | null = null;
/** consume 후에도 잠시 유지 — 화면 리마운트 시 payload가 사라지지 않게 */
let held: CommuteReadingRecommendPayload | null = null;

export function setCommuteReadingRecommend(payload: CommuteReadingRecommendPayload) {
  pending = payload;
  held = payload;
}

export function consumeCommuteReadingRecommend(): CommuteReadingRecommendPayload | null {
  const out = pending ?? held;
  pending = null;
  return out;
}

/** 분량 추천 모달을 띄울지 — `consume` 전에만 사용 */
export function hasPendingCommuteReadingRecommend(): boolean {
  return pending != null;
}
