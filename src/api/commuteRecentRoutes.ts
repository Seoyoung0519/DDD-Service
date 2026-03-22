/**
 * 최근 통근 경로
 * - GET /api/commute/recent-routes — 목록 조회
 * - POST /api/commute/recent-routes — 저장(경로 조회 직후 등). 서버만 recent_routes에 반영.
 *
 * axios `apiClient`만 쓰면 `x-user-id`가 없어 서버가 빈 목록/401을 줄 수 있어
 * `getDaedokdanApiAuthHeaders` + fetch 로 호출합니다.
 */
import { getDaedokdanApiAuthHeaders } from '@/src/api/readingSession';
import { MAIN_API_BASE_URL } from '@/src/config/api';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export type RecentCommuteRoute = {
  id: string;
  userId: string;
  originName: string;
  /** 서버에 좌표가 없거나 파싱 실패 시 null (이름만으로도 목록에는 표시) */
  originLat: number | null;
  originLng: number | null;
  destinationName: string;
  destinationLat: number | null;
  destinationLng: number | null;
  createdAt: string;
};

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeRoute(raw: unknown, index: number): RecentCommuteRoute | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = String(o.id ?? '').trim();
  const userId = String(o.user_id ?? o.userId ?? '').trim();
  const originName = String(o.origin_name ?? o.originName ?? '').trim();
  const destinationName = String(o.destination_name ?? o.destinationName ?? '').trim();

  const originLat = num(o.origin_lat ?? o.originLat);
  const originLng = num(o.origin_lng ?? o.originLng ?? o.origin_lon);
  const destinationLat = num(o.destination_lat ?? o.destinationLat);
  const destinationLng = num(o.destination_lng ?? o.destinationLng ?? o.destination_lon);

  const createdAt = String(o.created_at ?? o.createdAt ?? '').trim();

  if (!id || !originName || !destinationName) {
    if (__DEV__) {
      console.warn('[commuteRecentRoutes] skip route (missing id or names)', index, {
        id,
        originName,
        destinationName,
      });
    }
    return null;
  }

  return {
    id,
    userId,
    originName,
    originLat,
    originLng,
    destinationName,
    destinationLat,
    destinationLng,
    createdAt,
  };
}

/** 응답 본문에서 routes 배열 추출 (래핑 형태 여러 가지 대응) */
function extractRoutesArray(payload: unknown): unknown[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];

  if (Array.isArray(root.routes)) return root.routes;

  const data = root.data;
  if (Array.isArray(data)) return data;

  const dataObj = asRecord(data);
  if (dataObj && Array.isArray(dataObj.routes)) return dataObj.routes;

  return [];
}

/**
 * 최근 경로 최대 5건 (서버 정렬·상한)
 */
export async function fetchRecentCommuteRoutes(): Promise<RecentCommuteRoute[]> {
  const headers = await getDaedokdanApiAuthHeaders();
  const url = `${MAIN_API_BASE_URL}/api/commute/recent-routes`;

  const res = await fetch(url, {
    method: 'GET',
    headers,
  });

  const raw = await res.text().catch(() => '');

  let payload: unknown;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('최근 경로 응답을 해석하지 못했습니다.');
  }

  const root = asRecord(payload);
  if (root && root.success === false) {
    const err = root.error;
    throw new Error(
      typeof err === 'string' && err.trim()
        ? err
        : '최근 경로를 불러오지 못했습니다.',
    );
  }

  if (!res.ok) {
    let msg = raw;
    try {
      const j = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      if (typeof j.message === 'string') msg = j.message;
      else if (typeof j.error === 'string') msg = j.error;
      else if (typeof j.detail === 'string') msg = j.detail;
    } catch {
      /* raw */
    }
    throw new Error(
      (typeof msg === 'string' && msg.trim() ? msg : '') ||
        `최근 경로를 불러오지 못했습니다. (${res.status})`,
    );
  }

  const routesRaw = extractRoutesArray(payload);

  if (!Array.isArray(routesRaw)) {
    return [];
  }

  const normalized = routesRaw
    .map((r, i) => normalizeRoute(r, i))
    .filter((x): x is RecentCommuteRoute => x != null);

  if (__DEV__ && routesRaw.length !== normalized.length) {
    console.warn(
      '[commuteRecentRoutes] dropped routes (missing id/names):',
      routesRaw.length - normalized.length,
    );
  }

  return normalized.slice(0, 5);
}

/** 앱 내부 페이로드 — JSON으로는 `origin` / `destination` 객체로 직렬화 */
export type SaveRecentCommuteRoutePayload = {
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
};

/**
 * 최근 통근 경로 저장 (서버가 recent_routes에 upsert).
 * POST /api/commute/routes 만으로는 저장되지 않으므로, 경로 조회 성공 직후 호출할 것.
 * 서버는 `origin`·`destination` 각각 `{ name, lat, lng }` 형태를 요구함 ("origin and destination required").
 */
export async function saveRecentCommuteRoute(
  payload: SaveRecentCommuteRoutePayload,
): Promise<void> {
  const headers = await getDaedokdanApiAuthHeaders();
  const url = `${MAIN_API_BASE_URL}/api/commute/recent-routes`;

  const body = {
    origin: {
      name: payload.originName.trim(),
      lat: payload.originLat,
      lng: payload.originLng,
    },
    destination: {
      name: payload.destinationName.trim(),
      lat: payload.destinationLat,
      lng: payload.destinationLng,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const raw = await res.text().catch(() => '');

  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error('최근 경로 저장 응답을 해석하지 못했습니다.');
  }

  const root = asRecord(data);
  if (root && root.success === false) {
    const err = root.error;
    throw new Error(
      typeof err === 'string' && err.trim()
        ? err
        : '최근 경로를 저장하지 못했습니다.',
    );
  }

  if (!res.ok) {
    let msg = raw;
    try {
      const j = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      if (typeof j.message === 'string') msg = j.message;
      else if (typeof j.error === 'string') msg = j.error;
      else if (typeof j.detail === 'string') msg = j.detail;
    } catch {
      /* raw */
    }
    throw new Error(
      (typeof msg === 'string' && msg.trim() ? msg : '') ||
        `최근 경로를 저장하지 못했습니다. (${res.status})`,
    );
  }
}
