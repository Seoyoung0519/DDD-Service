import { MAIN_API_BASE_URL } from '@/src/config/api';
import { fetchCurrentUser, getMainApiAccessToken } from '@/src/services/auth/authService';
import type { CurrentReadingItem, BookshelfItem } from '@/src/types/reading';

/** 읽기 세션·분량 추천 — 메인 API와 동일 호스트(env로 오버라이드) */
const READING_API_BASE_URL =
  process.env.EXPO_PUBLIC_READING_API_BASE_URL ?? MAIN_API_BASE_URL;

type SessionType = 'commute' | 'timer';

export interface StartReadingSessionPayload {
  userId: string;
  userBookId: string;
  bookId: string;
  startPage: number;
  endPage: number;
  plannedPages?: number;
  sessionType?: SessionType;
  originPlaceId?: string | null;
  destinationPlaceId?: string | null;
  selectedRouteId?: string | null;
  /** 좌표 — 세션 POST 시 snake·camel 둘 다 실어 보냄(DB/ORM이 `origin_lat`만 매핑하는 경우 대비) */
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
}

/** 세션 API 응답의 통근 경로 한 구간 */
export interface CommuteRouteSegment {
  from: string;
  to: string;
  type: 'WALK' | 'SUBWAY' | 'BUS';
  minutes: number;
  line?: string;
  busNo?: string;
  wayCode?: number;
  subwayCode?: number;
  busType?: number;
  busLocalBlID?: string;
  /** ODsay 정규화 시 버스/지하철 정류장 좌표(선택) */
  fromStation?: { lat?: number; lng?: number; name?: string } | null;
  toStation?: { lat?: number; lng?: number; name?: string } | null;
}

/** 통근 경로 JSON (세션 시작 응답에 포함) */
export interface CommuteRouteJson {
  id: string;
  tag?: string;
  fare?: number;
  segments: CommuteRouteSegment[];
  transfers?: number;
  walkMinutes?: number;
  totalMinutes: number;
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  userBookId: string;
  plannedStartPage: number;
  plannedEndPage: number;
  plannedPages: number;
  actualStartPage: number | null;
  actualEndPage: number | null;
  actualPages: number | null;
  sessionType: SessionType;
  startedAt: string;
  endedAt: string | null;
  /** 통근 전체 소요 시간(분) */
  commuteTotalMinutes?: number | null;
  commuteRouteJson?: CommuteRouteJson | null;
}

export interface FinishReadingSessionPayload {
  actualStartPage?: number;
  actualEndPage?: number;
  actualPages?: number;
}

async function getAuthHeaders() {
  const token = await getMainApiAccessToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const user = await fetchCurrentUser();

  const apiKey = process.env.EXPO_PUBLIC_DAEDOKDAN_API_KEY;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'x-user-id': user.id,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  return headers;
}

/** 통근·읽기 등 `daedokdan-api.onrender.com` 호출 시 공통 헤더 (Bearer + x-user-id + x-api-key) */
export async function getDaedokdanApiAuthHeaders(): Promise<Record<string, string>> {
  return getAuthHeaders();
}

export async function startReadingSession(
  payload: StartReadingSessionPayload,
): Promise<ReadingSession> {
  const headers = await getAuthHeaders();

  const url = `${READING_API_BASE_URL}/api/reading/sessions`;

  const body: Record<string, unknown> = {
    user_id: payload.userId,
    user_book_id: payload.userBookId,
    book_id: payload.bookId,
    start_page: payload.startPage,
    end_page: payload.endPage,
    planned_pages:
      payload.plannedPages ?? Math.max(payload.endPage - payload.startPage + 1, 0),
    session_type: payload.sessionType ?? 'commute',
    /** place/route id — 서버 검증은 snake_case (`recommend/commute`와 동일) */
    origin_place_id: payload.originPlaceId ?? null,
    destination_place_id: payload.destinationPlaceId ?? null,
    selected_route_id: payload.selectedRouteId ?? null,
  };

  const n = (v: number | null | undefined) =>
    v != null && typeof v === 'number' && Number.isFinite(v) ? v : null;
  const oLat = n(payload.originLat);
  const oLng = n(payload.originLng);
  const dLat = n(payload.destinationLat);
  const dLng = n(payload.destinationLng);
  if (oLat != null) {
    body.origin_lat = oLat;
    body.originLat = oLat;
  }
  if (oLng != null) {
    body.origin_lng = oLng;
    body.originLng = oLng;
  }
  if (dLat != null) {
    body.destination_lat = dLat;
    body.destinationLat = dLat;
  }
  if (dLng != null) {
    body.destination_lng = dLng;
    body.destinationLng = dLng;
  }

  /** 개발 빌드: Metro에서 실제 전송 JSON 확인 (RN은 브라우저 네트워크 탭 없음) */
  if (__DEV__) {
    console.log(
      '[readingSession] POST /api/reading/sessions\n',
      'URL:',
      url,
      '\nBody (JSON):',
      JSON.stringify(body, null, 2),
    );
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const raw = await res.text().catch(() => '');

  if (!res.ok) {
    let msg = raw;
    try {
      const j = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      if (typeof j.message === 'string') msg = j.message;
      else if (typeof j.error === 'string') msg = j.error;
      else if (typeof j.detail === 'string') msg = j.detail;
    } catch {
      /* raw 텍스트 사용 */
    }
    throw new Error(
      msg.trim() || `읽기 세션을 시작하는 데 실패했습니다. (${res.status})`,
    );
  }

  let data: ReadingSession;
  try {
    data = (raw ? JSON.parse(raw) : {}) as ReadingSession;
  } catch {
    throw new Error('읽기 세션 응답을 해석하지 못했습니다.');
  }
  if (!data?.id) {
    throw new Error('읽기 세션 응답이 올바르지 않습니다.');
  }
  return data;
}

export async function finishReadingSession(
  sessionId: string,
  payload: FinishReadingSessionPayload,
): Promise<ReadingSession> {
  const headers = await getAuthHeaders();

  const url = `${READING_API_BASE_URL}/api/reading/sessions/${sessionId}/finish`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(
      errorText || `읽기 세션을 종료하는 데 실패했습니다. (${res.status})`,
    );
  }

  const data = (await res.json()) as ReadingSession;
  return data;
}

export function getIdsFromSelectedBook(
  book: CurrentReadingItem | BookshelfItem,
): { userBookId: string; bookId: string } {
  return {
    userBookId: book.userBookId,
    bookId: book.bookId,
  };
}

/** POST /api/reading/recommend/commute 요청 본문 */
export interface RecommendCommuteReadingRequest {
  userId: string;
  bookId: string;
  userBookId: string;
  /** JSON에는 `origin_place_id` 로 직렬화 */
  originPlaceId: string;
  destinationPlaceId: string;
  selectedRouteId: string;
  /** 선택 — JSON에는 `originLat` 등 camelCase */
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
}

export interface CommuteReadingSelectedRouteSummary {
  tag?: string | null;
  totalMinutes?: number;
  walkMinutes?: number;
  transfers?: number;
  fare?: number;
}

export interface CommuteReadingRecommendationMeta {
  userBookId: string;
  originPlaceId: string;
  destinationPlaceId: string;
  selectedRouteId: string;
  availableMinutes: number;
  selectedRouteSummary: CommuteReadingSelectedRouteSummary;
}

/** POST /api/reading/recommend/commute 응답 */
export interface CommuteReadingRecommendation {
  userBookId: string;
  bookId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  currentPage: number;
  startPage: number;
  endPage: number;
  pagesToRead: number;
  pageCount: number;
  remainingPages: number;
  availableMinutes: number;
  usedPpm: number;
  isAlreadyCompleted: boolean;
  difficultyFactor: number;
  slackFactor: number;
  meta: CommuteReadingRecommendationMeta;
}

/**
 * 통근 경로 기준 분량 추천 (이동 시간 → 읽을 페이지 범위)
 * POST /api/reading/recommend/commute
 */
export async function recommendCommuteReading(
  payload: RecommendCommuteReadingRequest,
): Promise<CommuteReadingRecommendation> {
  const headers = await getAuthHeaders();

  const url = `${READING_API_BASE_URL}/api/reading/recommend/commute`;

  /** 서버가 `origin_place_id` 등 snake_case 필수 검증 — place/route id는 snake, 좌표는 camelCase */
  const body: Record<string, unknown> = {
    user_id: payload.userId,
    book_id: payload.bookId,
    user_book_id: payload.userBookId,
    origin_place_id: payload.originPlaceId,
    destination_place_id: payload.destinationPlaceId,
    selected_route_id: payload.selectedRouteId,
  };

  const n = (v: number | null | undefined) =>
    v != null && typeof v === 'number' && Number.isFinite(v) ? v : null;
  const oLat = n(payload.originLat);
  const oLng = n(payload.originLng);
  const dLat = n(payload.destinationLat);
  const dLng = n(payload.destinationLng);
  if (oLat != null) {
    body.origin_lat = oLat;
    body.originLat = oLat;
  }
  if (oLng != null) {
    body.origin_lng = oLng;
    body.originLng = oLng;
  }
  if (dLat != null) {
    body.destination_lat = dLat;
    body.destinationLat = dLat;
  }
  if (dLng != null) {
    body.destination_lng = dLng;
    body.destinationLng = dLng;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('분량 추천 응답을 해석하지 못했습니다.');
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data != null && 'message' in data
        ? String((data as { message?: unknown }).message)
        : typeof data === 'object' && data != null && 'error' in data
          ? String((data as { error?: unknown }).error)
          : raw;
    throw new Error(msg || `분량 추천 요청에 실패했습니다. (${res.status})`);
  }

  // { success, data } 래핑 대응
  const unwrapped =
    typeof data === 'object' &&
    data != null &&
    'data' in data &&
    (data as { data?: unknown }).data != null
      ? (data as { data: CommuteReadingRecommendation }).data
      : (data as CommuteReadingRecommendation);

  if (
    !unwrapped ||
    typeof unwrapped !== 'object' ||
    typeof (unwrapped as CommuteReadingRecommendation).startPage !== 'number'
  ) {
    throw new Error('분량 추천 응답 형식이 올바르지 않습니다.');
  }

  return unwrapped as CommuteReadingRecommendation;
}

