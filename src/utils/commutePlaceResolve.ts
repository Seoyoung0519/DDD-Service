import type { CommutePlace } from '@/src/types/commute';

/** 위도·경도 차이 제곱합 (작을수록 가까움) */
function coordDistanceSq(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return dLat * dLat + dLng * dLng;
}

/**
 * 검색 결과 목록에서 (lat, lng)에 가장 가한 장소 선택.
 * 좌표 없는 항목은 스킵 후, 모두 없으면 첫 항목 반환.
 */
export function pickPlaceByNearestCoords(
  places: CommutePlace[],
  lat: number,
  lng: number,
): CommutePlace | null {
  if (!places.length) return null;

  const withCoords = places.filter(
    (p) => p.lat != null && p.lng != null && Number.isFinite(p.lat) && Number.isFinite(p.lng),
  );

  if (withCoords.length === 0) {
    return places[0] ?? null;
  }

  let best = withCoords[0];
  let bestSq = coordDistanceSq(best.lat!, best.lng!, lat, lng);

  for (let i = 1; i < withCoords.length; i++) {
    const p = withCoords[i];
    const sq = coordDistanceSq(p.lat!, p.lng!, lat, lng);
    if (sq < bestSq) {
      bestSq = sq;
      best = p;
    }
  }

  return best;
}

/**
 * 최근 경로 재선택 시: 저장된 좌표가 있으면 가장 가까운 장소, 없으면 검색 첫 항목.
 */
export function pickPlaceForRecentRoute(
  places: CommutePlace[],
  lat: number | null,
  lng: number | null,
): CommutePlace | null {
  if (!places.length) return null;
  if (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return pickPlaceByNearestCoords(places, lat, lng);
  }
  return places[0] ?? null;
}
