import type { CommuteRouteJson, CommuteRouteSegment } from '@/src/api/readingSession';

type StationLike = { lat?: unknown; lng?: unknown; name?: unknown } | null | undefined;

function finitePair(st: StationLike): { lat: number; lng: number } | null {
  if (!st || typeof st !== 'object') return null;
  const lat = typeof st.lat === 'number' ? st.lat : Number(st.lat);
  const lng = typeof st.lng === 'number' ? st.lng : Number(st.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * ODsay 정규화 경로에서 정류장 좌표로 출발/도착 근사치 추출.
 * 장소 검색 좌표가 비었을 때 세션 body 보강용 (백엔드가 본문 좌표를 무시해도 한 번 더 보냄).
 */
export function extractCommuteEndpointCoordsFromRoute(
  route: CommuteRouteJson | null | undefined,
): {
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
} {
  const segments = route?.segments ?? [];
  let originLat: number | null = null;
  let originLng: number | null = null;
  let destinationLat: number | null = null;
  let destinationLng: number | null = null;

  for (const seg of segments) {
    const s = seg as CommuteRouteSegment & {
      fromStation?: StationLike;
      toStation?: StationLike;
    };
    const from = finitePair(s.fromStation ?? null);
    if (from && originLat == null) {
      originLat = from.lat;
      originLng = from.lng;
    }
    const to = finitePair(s.toStation ?? null);
    if (to) {
      destinationLat = to.lat;
      destinationLng = to.lng;
    }
  }

  return { originLat, originLng, destinationLat, destinationLng };
}
