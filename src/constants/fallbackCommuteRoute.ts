import type { CommuteRouteJson } from '@/src/api/readingSession';

/** 서버 세션 API 실패 시 결과 화면에만 쓰는 예시 경로 */
export const FALLBACK_COMMUTE_ROUTE_JSON: CommuteRouteJson = {
  id: 'fallback-local',
  tag: '예시',
  totalMinutes: 21,
  segments: [
    {
      type: 'WALK',
      from: '출발지',
      to: '버스 정류장',
      minutes: 4,
    },
    {
      type: 'BUS',
      from: '용산구청',
      to: '신용산역(중)',
      minutes: 12,
      line: '간선',
      busNo: '740',
    },
    {
      type: 'WALK',
      from: '신용산역',
      to: '도착지',
      minutes: 5,
    },
  ],
};
