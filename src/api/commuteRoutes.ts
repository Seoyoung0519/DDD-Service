/**
 * 통근 경로 조회
 * POST /api/commute/routes
 * 출발/도착 placeId → 최적 1 + 대안 3 (정규화된 routes[])
 */
import { apiClient } from '@/src/api/client';
import type { CommuteRouteJson, CommuteRouteSegment } from '@/src/api/readingSession';

const ROUTES_PATH = '/api/commute/routes';

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

function normalizeSegment(raw: unknown, index: number): CommuteRouteSegment | null {
  const o = asRecord(raw);
  if (!o) return null;
  const type = String(o.type ?? '').toUpperCase();
  if (type !== 'WALK' && type !== 'SUBWAY' && type !== 'BUS') {
    console.warn('[commuteRoutes] skip segment type', index, type);
    return null;
  }
  const from = String(o.from ?? '').trim();
  const to = String(o.to ?? '').trim();
  const minutes = typeof o.minutes === 'number' ? o.minutes : Number(o.minutes);
  if (!from || !to || !Number.isFinite(minutes)) {
    return null;
  }
  const seg: CommuteRouteSegment = {
    type: type as CommuteRouteSegment['type'],
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
  const id = String(o.id ?? '').trim();
  const totalMinutes =
    typeof o.totalMinutes === 'number' ? o.totalMinutes : Number(o.totalMinutes);
  const segsRaw = o.segments;
  if (!id || !Number.isFinite(totalMinutes) || !Array.isArray(segsRaw)) {
    console.warn('[commuteRoutes] skip route', index);
    return null;
  }
  const segments = segsRaw
    .map((s, i) => normalizeSegment(s, i))
    .filter((x): x is CommuteRouteSegment => x != null);
  if (segments.length === 0) return null;

  const fare = typeof o.fare === 'number' ? o.fare : Number(o.fare);
  const transfers = typeof o.transfers === 'number' ? o.transfers : Number(o.transfers);
  const walkMinutes =
    typeof o.walkMinutes === 'number' ? o.walkMinutes : Number(o.walkMinutes);

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

/**
 * 출발/도착 placeId로 통근 경로 목록 조회 (최적 + 대안)
 */
export async function fetchCommuteRoutes(
  body: CommuteRoutesRequestBody,
): Promise<CommuteRouteJson[]> {
  const requestBody: Record<string, unknown> = {
    originPlaceId: body.originPlaceId,
    destinationPlaceId: body.destinationPlaceId,
  };
  const n = (v: number | null | undefined) =>
    v != null && typeof v === 'number' && Number.isFinite(v) ? v : null;
  const oLat = n(body.originLat);
  const oLng = n(body.originLng);
  const dLat = n(body.destinationLat);
  const dLng = n(body.destinationLng);
  if (oLat != null) {
    requestBody.origin_lat = oLat;
    requestBody.originLat = oLat;
  }
  if (oLng != null) {
    requestBody.origin_lng = oLng;
    requestBody.originLng = oLng;
  }
  if (dLat != null) {
    requestBody.destination_lat = dLat;
    requestBody.destinationLat = dLat;
  }
  if (dLng != null) {
    requestBody.destination_lng = dLng;
    requestBody.destinationLng = dLng;
  }

  const res = await apiClient.post<CommuteRoutesApiResponse>(ROUTES_PATH, requestBody);

  const payload = res.data;
  if (!payload || payload.success === false) {
    const err = payload?.error;
    throw new Error(
      typeof err === 'string' && err
        ? err
        : '통근 경로를 조회하지 못했습니다.',
    );
  }

  const list = payload.data?.routes;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('조회된 경로가 없습니다.');
  }

  const routes = list
    .map((r, i) => normalizeRoute(r, i))
    .filter((x): x is CommuteRouteJson => x != null);

  if (routes.length === 0) {
    throw new Error('유효한 경로 데이터가 없습니다.');
  }

  return routes;
}
