import type {
  CommuteReadingRecommendation,
  CommuteRouteJson,
  CommuteRouteSegment,
  ReadingSession,
} from '@/src/api/readingSession';
import type { CommuteReadingRecommendPayload } from '@/src/state/commuteReadingRecommend';
import type { CurrentReadingItem } from '@/src/types/reading';

/** POST /api/commute/routes 요청 예시 (API 문서 4-2) */
export const DEMO_COMMUTE_ROUTES_REQUEST = {
  originPlaceId: '21160600',
  destinationPlaceId: '1913983226',
} as const;

/** 출·도착 좌표 — 지도·데모 위치 시뮬레이션용 (성신여대입구 → 남산서울타워) */
export const DEMO_COMMUTE_COORDS = {
  origin: { lat: 37.5932, lng: 127.0148, name: '출발지' },
  destination: { lat: 37.5512, lng: 126.9882, name: '남산서울타워' },
} as const;

const STATIONS = {
  sungshin: { lat: 37.592604, lng: 127.016403, name: '성신여대입구' },
  chungmuro: { lat: 37.561235, lng: 126.994168, name: '충무로' },
  chungmuroExit2: { lat: 37.5605, lng: 126.9945, name: '충무로역2번출구.대한극장앞' },
  namsanTower: { lat: 37.551169, lng: 126.988227, name: '남산서울타워' },
} as const;

/** API 문서 4-3 성공 응답 `data.routes` (최적 1 + 대안 3) */
export const DEMO_COMMUTE_ROUTES: CommuteRouteJson[] = [
  {
    id: '0',
    tag: '최적',
    totalMinutes: 32,
    transfers: 2,
    walkMinutes: 6,
    fare: 1550,
    segments: [
      { type: 'WALK', minutes: 1, from: '출발지', to: '성신여대입구' },
      {
        type: 'SUBWAY',
        minutes: 10,
        from: '성신여대입구',
        to: '충무로',
        line: '수도권 4호선',
        subwayCode: 4,
        wayCode: 2,
      },
      { type: 'WALK', minutes: 1, from: '충무로', to: '충무로역2번출구.대한극장앞' },
      {
        type: 'BUS',
        minutes: 16,
        from: '충무로역2번출구.대한극장앞',
        to: '남산서울타워',
        busNo: '01(녹색순환)',
        busType: 13,
        busLocalBlID: '100100001',
      },
      { type: 'WALK', minutes: 4, from: '남산서울타워', to: '도착지' },
    ],
  },
  {
    id: '1',
    tag: '대안',
    totalMinutes: 34,
    transfers: 2,
    walkMinutes: 12,
    fare: 1550,
    segments: [
      { type: 'WALK', minutes: 1, from: '출발지', to: '성신여대입구' },
      {
        type: 'SUBWAY',
        minutes: 13,
        from: '성신여대입구',
        to: '회현',
        line: '수도권 4호선',
        subwayCode: 4,
        wayCode: 2,
      },
      { type: 'WALK', minutes: 4, from: '회현', to: '숭례문남산방향' },
      {
        type: 'BUS',
        minutes: 9,
        from: '숭례문남산방향',
        to: '후암약수터',
        busNo: '402',
        busType: 11,
        busLocalBlID: '100100063',
      },
      { type: 'WALK', minutes: 7, from: '후암약수터', to: '도착지' },
    ],
  },
  {
    id: '2',
    tag: '대안',
    totalMinutes: 32,
    transfers: 3,
    walkMinutes: 6,
    fare: 1550,
    segments: [
      { type: 'WALK', minutes: 1, from: '출발지', to: '성신여대입구' },
      {
        type: 'SUBWAY',
        minutes: 10,
        from: '성신여대입구',
        to: '충무로',
        line: '수도권 4호선',
        subwayCode: 4,
        wayCode: 2,
      },
      { type: 'WALK', minutes: 0, from: '충무로', to: '충무로' },
      {
        type: 'SUBWAY',
        minutes: 4,
        from: '충무로',
        to: '동대입구',
        line: '수도권 3호선',
        subwayCode: 3,
        wayCode: 2,
      },
      { type: 'WALK', minutes: 1, from: '동대입구', to: '동대입구역.장충동' },
      {
        type: 'BUS',
        minutes: 12,
        from: '동대입구역.장충동',
        to: '남산서울타워',
        busNo: '01(녹색순환)',
        busType: 13,
        busLocalBlID: '100100001',
      },
      { type: 'WALK', minutes: 4, from: '남산서울타워', to: '도착지' },
    ],
  },
  {
    id: '3',
    tag: '대안',
    totalMinutes: 38,
    transfers: 2,
    walkMinutes: 12,
    fare: 1550,
    segments: [
      { type: 'WALK', minutes: 1, from: '출발지', to: '성신여대입구' },
      {
        type: 'SUBWAY',
        minutes: 13,
        from: '성신여대입구',
        to: '회현',
        line: '수도권 4호선',
        subwayCode: 4,
        wayCode: 2,
      },
      { type: 'WALK', minutes: 4, from: '회현', to: '북창동.남대문시장' },
      {
        type: 'BUS',
        minutes: 13,
        from: '북창동.남대문시장',
        to: '후암약수터',
        busNo: '405',
        busType: 11,
        busLocalBlID: '100100597',
      },
      { type: 'WALK', minutes: 7, from: '후암약수터', to: '도착지' },
    ],
  },
];

export const DEMO_SELECTED_ROUTE_ID = '0';

export const DEMO_OPTIMAL_ROUTE = DEMO_COMMUTE_ROUTES[0];

/** 경로 조회 API를 건너뛰고 데모 데이터로 분량 추천·독서 세션 진행 */
export function isSkipCommuteRouteSearchEnabled(): boolean {
  const raw = String(process.env.EXPO_PUBLIC_SKIP_COMMUTE_ROUTE_SEARCH ?? '')
    .trim()
    .toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function enrichOptimalRouteWithStations(route: CommuteRouteJson): CommuteRouteJson {
  const segments: CommuteRouteSegment[] = route.segments.map((seg, idx) => {
    const next = { ...seg };
    if (idx === 0) {
      next.toStation = STATIONS.sungshin;
    }
    if (seg.from === '성신여대입구') {
      next.fromStation = STATIONS.sungshin;
    }
    if (seg.to === '충무로') {
      next.toStation = STATIONS.chungmuro;
    }
    if (seg.from === '충무로') {
      next.fromStation = STATIONS.chungmuro;
    }
    if (seg.to === '충무로역2번출구.대한극장앞') {
      next.toStation = STATIONS.chungmuroExit2;
    }
    if (seg.from === '충무로역2번출구.대한극장앞') {
      next.fromStation = STATIONS.chungmuroExit2;
    }
    if (seg.to === '남산서울타워') {
      next.toStation = STATIONS.namsanTower;
    }
    if (seg.from === '남산서울타워') {
      next.fromStation = STATIONS.namsanTower;
    }
    return next;
  });

  return { ...route, segments };
}

export const DEMO_OPTIMAL_ROUTE_WITH_STATIONS = enrichOptimalRouteWithStations(DEMO_OPTIMAL_ROUTE);

function interpolateSearchCoords(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  t: number,
): { lat: number; lng: number } {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

/**
 * 통근 경로 API 실패 시 에뮬레이터에서 세션 플로우를 이어가기 위한 데모 경로.
 * `EXPO_PUBLIC_DEMO_COMMUTE_LOCATION=true` 이거나 `EXPO_PUBLIC_COMMUTE_ROUTES_DEV_FALLBACK=true` 일 때 사용.
 */
export function isCommuteRoutesDevFallbackEnabled(): boolean {
  if (!__DEV__) return false;
  const raw = String(process.env.EXPO_PUBLIC_COMMUTE_ROUTES_DEV_FALLBACK ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  return process.env.EXPO_PUBLIC_DEMO_COMMUTE_LOCATION === 'true';
}

export function buildDevCommuteRoutesFromSearch(input: {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  departureLabel?: string;
  arrivalLabel?: string;
}): CommuteRouteJson[] {
  const originName = input.departureLabel?.trim() || '출발지';
  const destName = input.arrivalLabel?.trim() || '도착지';
  const origin = { lat: input.originLat, lng: input.originLng };
  const destination = { lat: input.destinationLat, lng: input.destinationLng };
  const baseSegments = DEMO_OPTIMAL_ROUTE.segments;
  const count = baseSegments.length;

  const segments: CommuteRouteSegment[] = baseSegments.map((seg, index) => {
    const fromCoords = interpolateSearchCoords(origin, destination, index / count);
    const toCoords = interpolateSearchCoords(origin, destination, (index + 1) / count);
    const next: CommuteRouteSegment = { ...seg };
    if (index === 0) next.from = originName;
    if (index === count - 1) next.to = destName;
    next.fromStation = { lat: fromCoords.lat, lng: fromCoords.lng, name: next.from };
    next.toStation = { lat: toCoords.lat, lng: toCoords.lng, name: next.to };
    return next;
  });

  return [
    {
      ...DEMO_OPTIMAL_ROUTE,
      id: 'dev-fallback-0',
      tag: '데모(개발)',
      segments,
    },
  ];
}

function normalizeAuthors(authors: CurrentReadingItem['authors']): string[] {
  if (!authors) return [];
  if (Array.isArray(authors)) return authors;
  return [authors];
}

/** POST /api/reading/recommend/commute 응답 형태 */
export function buildDemoCommuteReadingRecommendation(
  book: Pick<
    CurrentReadingItem,
    'userBookId' | 'bookId' | 'title' | 'authors' | 'coverUrl' | 'currentPage' | 'pageCount'
  >,
): CommuteReadingRecommendation {
  const route = DEMO_OPTIMAL_ROUTE;
  const availableMinutes = route.totalMinutes;
  const currentPage = Math.max(1, book.currentPage ?? 1);
  const pageCount = book.pageCount ?? 300;
  const usedPpm = 0.55;
  const pagesToRead = Math.min(
    Math.max(1, pageCount - currentPage + 1),
    Math.max(5, Math.round(availableMinutes * usedPpm)),
  );
  const startPage = currentPage;
  const endPage = Math.min(pageCount, startPage + pagesToRead - 1);

  return {
    userBookId: book.userBookId,
    bookId: book.bookId,
    title: book.title,
    authors: normalizeAuthors(book.authors),
    coverUrl: book.coverUrl,
    currentPage,
    startPage,
    endPage,
    pagesToRead: endPage - startPage + 1,
    pageCount,
    remainingPages: Math.max(0, pageCount - currentPage),
    availableMinutes,
    usedPpm,
    isAlreadyCompleted: false,
    difficultyFactor: 1,
    slackFactor: 0.9,
    meta: {
      userBookId: book.userBookId,
      originPlaceId: DEMO_COMMUTE_ROUTES_REQUEST.originPlaceId,
      destinationPlaceId: DEMO_COMMUTE_ROUTES_REQUEST.destinationPlaceId,
      selectedRouteId: DEMO_SELECTED_ROUTE_ID,
      availableMinutes,
      selectedRouteSummary: {
        tag: route.tag,
        totalMinutes: route.totalMinutes,
        walkMinutes: route.walkMinutes,
        transfers: route.transfers,
        fare: route.fare,
      },
    },
  };
}

/** POST /api/reading/sessions 응답 형태 (통근 세션) */
export function buildDemoReadingSession(
  ctx: CommuteReadingRecommendPayload,
  rec: CommuteReadingRecommendation,
): ReadingSession {
  return {
    id: `demo-session-${Date.now()}`,
    userId: ctx.userId,
    bookId: rec.bookId,
    userBookId: rec.userBookId,
    plannedStartPage: rec.startPage,
    plannedEndPage: rec.endPage,
    plannedPages: rec.pagesToRead,
    actualStartPage: null,
    actualEndPage: null,
    actualPages: null,
    sessionType: 'commute',
    startedAt: new Date().toISOString(),
    endedAt: null,
    commuteTotalMinutes: DEMO_OPTIMAL_ROUTE.totalMinutes,
    commuteRouteJson: DEMO_OPTIMAL_ROUTE_WITH_STATIONS,
  };
}

export function buildDemoCommuteReadingRecommendPayload(
  userId: string,
  book: CurrentReadingItem,
): CommuteReadingRecommendPayload {
  return {
    userId,
    bookId: book.bookId,
    userBookId: book.userBookId,
    originPlaceId: DEMO_COMMUTE_ROUTES_REQUEST.originPlaceId,
    destinationPlaceId: DEMO_COMMUTE_ROUTES_REQUEST.destinationPlaceId,
    selectedRouteId: DEMO_SELECTED_ROUTE_ID,
    availableMinutes: DEMO_OPTIMAL_ROUTE.totalMinutes,
    originLat: DEMO_COMMUTE_COORDS.origin.lat,
    originLng: DEMO_COMMUTE_COORDS.origin.lng,
    destinationLat: DEMO_COMMUTE_COORDS.destination.lat,
    destinationLng: DEMO_COMMUTE_COORDS.destination.lng,
    demoBook: {
      userBookId: book.userBookId,
      bookId: book.bookId,
      title: book.title,
      authors: book.authors,
      coverUrl: book.coverUrl,
      currentPage: book.currentPage,
      pageCount: book.pageCount,
    },
  };
}
