/**
 * 출발지/도착지 장소 검색
 * GET /api/commute/places/search?query=...&size=...
 *
 * 문서: `query`(필수), `size`(선택, 기본 10)
 * 응답: `{ success, data: { places: [{ placeId, name, address, lat, lng }] }, error }`
 */
import { apiClient } from '@/src/api/client';
import type { CommutePlace, CommutePlacesSearchApiResponse } from '@/src/types/commute';

const SEARCH_PATH = '/api/commute/places/search';

/** 자동완성 드롭다운 — 최대 표시 건수 */
export const COMMUTE_PLACES_AUTOCOMPLETE_MAX = 4;
/** 전체 검색 화면 — API `size`(서버 상한에 맞게 조정) */
export const COMMUTE_PLACES_FULL_SEARCH_MAX = 100;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function extractPlaces(body: unknown): unknown[] {
  const o = asRecord(body);
  if (!o) return [];

  if (o.success === false) {
    const err = o.error;
    if (typeof err === 'string' && err) {
      console.warn('[commutePlaces] API error:', err);
    }
    return [];
  }

  const data = asRecord(o.data);
  if (!data) return [];

  const places = data.places;
  if (Array.isArray(places)) return places;

  return [];
}

/** API 한 건 → CommutePlace (문서 3-4 `data.places[]`) */
function normalizeOne(raw: unknown, index: number): CommutePlace | null {
  const o = asRecord(raw);
  if (!o) return null;

  const placeId = String(o.placeId ?? o.place_id ?? '').trim();
  const name = String(o.name ?? '').trim();
  const address = o.address != null ? String(o.address) : '';

  if (!placeId || !name) {
    console.warn('[commutePlaces] skip item without placeId/name', index, raw);
    return null;
  }

  const lat = typeof o.lat === 'number' ? o.lat : Number(o.lat);
  /** API가 `lng` 대신 `lon` / `longitude` 로 줄 수 있음 */
  const lngRaw = o.lng ?? o.lon ?? o.longitude;
  const lng = typeof lngRaw === 'number' ? lngRaw : Number(lngRaw);

  const categoryRaw =
    o.category ?? o.placeCategory ?? o.place_type ?? o.type ?? o.placeType;
  const category =
    categoryRaw != null ? String(categoryRaw).trim() || undefined : undefined;

  let distanceMeters: number | undefined;
  const distRaw = o.distanceMeters ?? o.distance_meters ?? o.distanceFromUser ?? o.distance;
  if (typeof distRaw === 'number' && Number.isFinite(distRaw)) {
    distanceMeters = distRaw;
  } else if (typeof distRaw === 'string') {
    const n = parseFloat(String(distRaw).replace(/[^0-9.]/g, ''));
    if (Number.isFinite(n)) distanceMeters = n;
  }

  return {
    placeId,
    label: name,
    subtitle: address || undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    category,
    distanceMeters,
  };
}

export type SearchCommutePlacesOptions = {
  /** API `size` — 반환 개수 (기본 10, 서버 상한 가능) */
  size?: number;
};

/**
 * 장소 검색
 * @param query 검색어 (`query` 쿼리 파라미터)
 * @param options.size API `size` (자동완성은 보통 4, 전체 목록은 생략 또는 큰 값)
 */
export async function searchCommutePlaces(
  query: string,
  options?: SearchCommutePlacesOptions,
): Promise<CommutePlace[]> {
  const q = query.trim();
  if (!q) return [];

  const params: Record<string, string | number> = { query: q };
  const size = options?.size;
  if (typeof size === 'number' && size > 0) {
    params.size = size;
  }

  const res = await apiClient.get<CommutePlacesSearchApiResponse>(SEARCH_PATH, {
    params,
  });

  const list = extractPlaces(res.data)
    .map((item, i) => normalizeOne(item, i))
    .filter((x): x is CommutePlace => x != null);

  return list;
}
