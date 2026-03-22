import type { CommuteRouteJson } from '@/src/api/readingSession';

/** 읽기 세션 시작 시 `startReadingSession`에 넘길 초안 */
export type CommuteSessionDraft = {
  userId: string;
  userBookId: string;
  bookId: string;
  startPage: number;
  endPage: number;
  plannedPages: number;
};

/** `CommuteRouteResultScreen`으로 전달 — POST /api/commute/routes 결과 + 세션 초안 */
export type CommuteRouteResultPayload = {
  departureLabel: string;
  arrivalLabel: string;
  originPlaceId: string;
  destinationPlaceId: string;
  /** 장소 검색에서 확보한 좌표 — 읽기 세션 DB 저장용 */
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  /** 최적 + 대안 경로 목록 */
  routes: CommuteRouteJson[];
  /** 현재 선택된 경로 id (`selectedRouteId`로 세션 시작) */
  selectedRouteId: string;
  /** 읽기 시작 버튼용 — 로그인/책 정보 조회 후에만 존재 */
  sessionDraft: CommuteSessionDraft | null;
  /** 서버 오류 시 예시 경로만 쓸 때 */
  warningMessage?: string;
  isFallback?: boolean;
};

let pending: CommuteRouteResultPayload | null = null;

export function setCommuteRouteResult(payload: CommuteRouteResultPayload) {
  pending = payload;
}

export function consumeCommuteRouteResult(): CommuteRouteResultPayload | null {
  const out = pending;
  pending = null;
  return out;
}
