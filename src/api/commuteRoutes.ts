/**
 * 통근 경로 조회
 * POST /api/commute/routes
 * 출발/도착 placeId → 최적 1 + 대안 3 (정규화된 routes[])
 */
import { formatApiErrorBodyForLog } from '@/src/api/client';
import { getDaedokdanApiAuthHeaders } from '@/src/api/readingSession';
import { MAIN_API_BASE_URL } from '@/src/config/api';
import type { CommuteRouteJson, CommuteRouteSegment } from '@/src/api/readingSession';

const ROUTES_PATH = '/api/commute/routes';
/** Render → EC2 → ODsay 연동으로 25초 이상 걸릴 수 있음 */
const ROUTES_TIMEOUT_MS = 60000;
const ROUTES_MAX_ATTEMPTS = 2;

class CommuteRoutesHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: string,
  ) {
    super(message);
    this.name = 'CommuteRoutesHttpError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function devLog(...args: unknown[]) {
  if (__DEV__) {
    console.warn('[commuteRoutes]', ...args);
  }
}

function devLogFailure(
  error: unknown,
  requestJson: string,
  attempt: number,
) {
  if (!__DEV__) return;
  if (error instanceof CommuteRoutesHttpError) {
    devLog(`FAIL attempt=${attempt + 1}`, {
      url: `${MAIN_API_BASE_URL}${ROUTES_PATH}`,
      requestJson,
      status: error.status,
      message: error.message,
      body: error.responseBody.slice(0, 800),
    });
    return;
  }
  devLog(`FAIL attempt=${attempt + 1}`, { requestJson, error });
}

function isRetriableCommuteRoutesError(error: unknown): boolean {
  if (error instanceof CommuteRoutesHttpError) {
    if (error.status >= 500) return true;
    return error.message.toLowerCase().includes('timeout');
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError') return true;
    if (error.message.toLowerCase().includes('network')) return true;
  }
  return false;
}

function isCommuteRoutesInfrastructureError(message: string): boolean {
  return /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|13\.236\.139\.76|:4000|odsay|ApiKeyAuthFailed|502|503/i.test(
    message,
  );
}

function formatCommuteRoutesUserError(error: unknown): string {
  if (error instanceof CommuteRoutesHttpError) {
    const raw = error.message.toLowerCase();
    if (raw.includes('timeout') || raw.includes('초과')) {
      return '길찾기 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.';
    }
    if (isCommuteRoutesInfrastructureError(error.message) || isCommuteRoutesInfrastructureError(error.responseBody)) {
      return '통근 경로 서버(ODsay·EC2 연동)에 연결할 수 없습니다. 잠시 후 다시 시도하거나 백엔드·API 키 설정을 확인해 주세요.';
    }
    if (error.status === 401 || error.status === 403) {
      return '통근 경로 조회 권한이 없습니다. 로그인·EXPO_PUBLIC_DAEDOKDAN_API_KEY 설정을 확인해 주세요.';
    }
    return error.message || `통근 경로를 조회하지 못했습니다. (HTTP ${error.status})`;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return `길찾기 응답이 ${ROUTES_TIMEOUT_MS / 1000}초 안에 오지 않았습니다. 서버(ODsay) 처리가 느릴 수 있으니 잠시 후 다시 시도해 주세요.`;
  }
  if (error instanceof Error && error.message.trim()) {
    if (isCommuteRoutesInfrastructureError(error.message)) {
      return '통근 경로 서버(ODsay·EC2 연동)에 연결할 수 없습니다. 잠시 후 다시 시도하거나 백엔드·API 키 설정을 확인해 주세요.';
    }
    return error.message;
  }
  return '통근 경로를 조회하지 못했습니다.';
}

function parseHttpErrorMessage(status: number, raw: string, data: unknown): string {
  const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const fromError = typeof o?.error === 'string' ? o.error : '';
  const fromMessage = typeof o?.message === 'string' ? o.message : '';
  const detail = fromError || fromMessage || raw.trim();
  return detail || `통근 경로를 조회하지 못했습니다. (HTTP ${status})`;
}

/**
 * RN axios는 POST body를 잘못 직렬화하는 경우가 있어
 * commuteRecentRoutes·readingSession과 동일하게 fetch + JSON.stringify 사용.
 */
async function postCommuteRoutes(
  requestBody: Record<string, unknown>,
): Promise<CommuteRoutesApiResponse> {
  const headers = await getDaedokdanApiAuthHeaders();
  const url = `${MAIN_API_BASE_URL}${ROUTES_PATH}`;
  const bodyJson = JSON.stringify(requestBody);
  devLog('REQUEST JSON', bodyJson);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROUTES_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyJson,
      signal: controller.signal,
    });

    const raw = await res.text().catch(() => '');

    let data: CommuteRoutesApiResponse;
    try {
      data = raw
        ? (JSON.parse(raw) as CommuteRoutesApiResponse)
        : { success: false, error: 'Empty response' };
    } catch {
      throw new CommuteRoutesHttpError(
        '통근 경로 응답을 해석하지 못했습니다.',
        res.status,
        raw,
      );
    }

    if (!res.ok) {
      throw new CommuteRoutesHttpError(parseHttpErrorMessage(res.status, raw, data), res.status, raw);
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

export type CommuteRoutesRequestBody = {
  originPlaceId: string;
  destinationPlaceId: string;
  /** 장소 좌표 — `origin_lat`·`originLat` 동시 전송 (서버 스키마 호환) */
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
};

type CommuteRoutesApiResponse = {
  success: boolean;
  data?: {
    routes?: unknown[];
  } | null;
  error?: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function normalizeSegmentType(raw: unknown): CommuteRouteSegment['type'] | null {
  const type = String(raw ?? '').toUpperCase();
  if (type === 'WALK' || type === 'WALKING') return 'WALK';
  if (type === 'BUS') return 'BUS';
  if (type === 'SUBWAY' || type === 'TRAIN' || type === 'RAIL' || type === 'METRO') {
    return 'SUBWAY';
  }
  return null;
}

function normalizeSegment(raw: unknown, index: number): CommuteRouteSegment | null {
  const o = asRecord(raw);
  if (!o) return null;
  const type = normalizeSegmentType(o.type);
  if (!type) {
    devLog('skip segment type', index, o.type);
    return null;
  }
  const from = String(o.from ?? o.fromName ?? '').trim();
  const to = String(o.to ?? o.toName ?? '').trim();
  const minutesRaw = o.minutes ?? o.duration ?? o.durationMinutes;
  const minutes = typeof minutesRaw === 'number' ? minutesRaw : Number(minutesRaw);
  if (!from || !to || !Number.isFinite(minutes)) {
    devLog('skip segment fields', index, { from, to, minutes: minutesRaw });
    return null;
  }
  const seg: CommuteRouteSegment = {
    type,
    from,
    to,
    minutes,
  };
  if (o.line != null) seg.line = String(o.line);
  if (o.busNo != null) seg.busNo = String(o.busNo);
  if (o.busLocalBlID != null) seg.busLocalBlID = String(o.busLocalBlID);
  const wc = typeof o.wayCode === 'number' ? o.wayCode : Number(o.wayCode);
  if (Number.isFinite(wc)) seg.wayCode = wc;
  const sc = typeof o.subwayCode === 'number' ? o.subwayCode : Number(o.subwayCode);
  if (Number.isFinite(sc)) seg.subwayCode = sc;
  const bt = typeof o.busType === 'number' ? o.busType : Number(o.busType);
  if (Number.isFinite(bt)) seg.busType = bt;

  const fromStation = o.fromStation;
  if (fromStation != null && typeof fromStation === 'object') {
    seg.fromStation = fromStation as CommuteRouteSegment['fromStation'];
  }
  const toStation = o.toStation;
  if (toStation != null && typeof toStation === 'object') {
    seg.toStation = toStation as CommuteRouteSegment['toStation'];
  }
  return seg;
}

function normalizeRoute(raw: unknown, index: number): CommuteRouteJson | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = String(o.id ?? o.route_id ?? o.routeId ?? '').trim();
  const totalRaw = o.totalMinutes ?? o.total_minutes ?? o.duration;
  const totalMinutes = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw);
  const segsRaw = o.segments;
  if (!id || !Number.isFinite(totalMinutes) || !Array.isArray(segsRaw)) {
    devLog('skip route', index, { id, totalMinutes: totalRaw, hasSegments: Array.isArray(segsRaw) });
    return null;
  }
  const segments = segsRaw
    .map((s, i) => normalizeSegment(s, i))
    .filter((x): x is CommuteRouteSegment => x != null);
  if (segments.length === 0) {
    devLog('skip route — no valid segments', index);
    return null;
  }

  const fare = typeof o.fare === 'number' ? o.fare : Number(o.fare);
  const transfers = typeof o.transfers === 'number' ? o.transfers : Number(o.transfers);
  const walkMinutes =
    typeof o.walkMinutes === 'number' ? o.walkMinutes : Number(o.walkMinutes ?? o.walk_minutes);

  return {
    id,
    tag: o.tag != null ? String(o.tag) : undefined,
    fare: Number.isFinite(fare) ? fare : undefined,
    totalMinutes,
    transfers: Number.isFinite(transfers) ? transfers : undefined,
    walkMinutes: Number.isFinite(walkMinutes) ? walkMinutes : undefined,
    segments,
  };
}

/** API 문서 4-2: originPlaceId·destinationPlaceId만 필수 (좌표는 서버가 placeId로 조회) */
function buildCommuteRoutesRequestBody(body: CommuteRoutesRequestBody): Record<string, unknown> {
  return {
    originPlaceId: body.originPlaceId,
    destinationPlaceId: body.destinationPlaceId,
  };
}

/**
 * 출발/도착 placeId로 통근 경로 목록 조회 (최적 + 대안)
 */
export async function fetchCommuteRoutes(
  body: CommuteRoutesRequestBody,
): Promise<CommuteRouteJson[]> {
  const requestBody = buildCommuteRoutesRequestBody(body);
  const requestJson = JSON.stringify(requestBody);

  let lastError: unknown;
  for (let attempt = 0; attempt < ROUTES_MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) {
        devLog('retry…');
        await sleep(1500);
      }
      const payload = await postCommuteRoutes(requestBody);
      const routes = parseCommuteRoutesPayload(payload);
      devLog('OK', {
        routeCount: routes.length,
        ids: routes.map((r) => r.id),
        tags: routes.map((r) => r.tag ?? ''),
      });
      return routes;
    } catch (error) {
      lastError = error;
      devLogFailure(error, requestJson, attempt);
      if (attempt === 0 && isRetriableCommuteRoutesError(error)) {
        continue;
      }
      break;
    }
  }

  throw new Error(formatCommuteRoutesUserError(lastError));
}

function parseCommuteRoutesPayload(payload: CommuteRoutesApiResponse): CommuteRouteJson[] {
  if (!payload || payload.success === false) {
    const err = payload?.error;
    if (__DEV__) {
      devLog('API success=false', payload);
    }
    throw new Error(
      typeof err === 'string' && err ? err : '통근 경로를 조회하지 못했습니다.',
    );
  }

  const list = payload.data?.routes;
  if (!Array.isArray(list) || list.length === 0) {
    if (__DEV__) {
      devLog('empty routes array', payload);
    }
    throw new Error('조회된 경로가 없습니다.');
  }

  const routes = list
    .map((r, i) => normalizeRoute(r, i))
    .filter((x): x is CommuteRouteJson => x != null);

  if (routes.length === 0) {
    if (__DEV__) {
      devLog('normalize dropped all routes — raw[0]:', formatApiErrorBodyForLog(list[0], 1200));
    }
    throw new Error('유효한 경로 데이터가 없습니다. (응답 형식 불일치)');
  }

  return routes;
}
