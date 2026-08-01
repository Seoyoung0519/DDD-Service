import { DEFAULT_ALERT_RADIUS_M } from '@/src/features/readingSession/types/readingSession.types';
import type {
  AlertPoint,
  LatLng,
  PlaceMarker,
  RouteSegment,
  RouteStation,
} from '@/src/features/readingSession/types/readingSession.types';

function stationToLatLng(station: RouteStation | null | undefined): LatLng | null {
  if (!station) return null;
  const lat = typeof station.lat === 'number' ? station.lat : Number(station.lat);
  const lng = typeof station.lng === 'number' ? station.lng : Number(station.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function segmentJunctionCoords(prev: RouteSegment, next: RouteSegment): LatLng | null {
  return (
    stationToLatLng(next.fromStation) ??
    stationToLatLng(prev.toStation) ??
    null
  );
}

function segmentWalkEndCoords(seg: RouteSegment, next?: RouteSegment): LatLng | null {
  return (
    stationToLatLng(seg.toStation) ??
    stationToLatLng(next?.fromStation) ??
    null
  );
}

function segmentWalkStartCoords(
  seg: RouteSegment,
  segIndex: number,
  origin?: PlaceMarker | null,
): LatLng | null {
  if (segIndex === 0 && origin) {
    return { lat: origin.lat, lng: origin.lng };
  }
  return stationToLatLng(seg.fromStation);
}

function alertPointSortKey(point: AlertPoint): number {
  const walkStart = point.id.match(/^walk-start-(\d+)$/);
  if (walkStart) return Number(walkStart[1]) * 100;
  const walkEnd = point.id.match(/^walk-(\d+)$/);
  if (walkEnd) return Number(walkEnd[1]) * 100 + 50;
  const transfer = point.id.match(/^transfer-(\d+)$/);
  if (transfer) return Number(transfer[1]) * 100 + 75;
  if (point.type === 'DESTINATION') return 99_999;
  return 50_000;
}

/** 경로 순서대로 정렬 (출발 도보 안내 walk-start-0 제외한 이동 지점) */
export function getRouteMovementAlertPoints(alertPoints: AlertPoint[]): AlertPoint[] {
  return [...alertPoints]
    .filter((p) => p.type !== 'DESTINATION' && p.id !== 'walk-start-0')
    .sort((a, b) => alertPointSortKey(a) - alertPointSortKey(b));
}

export function getMovementAlertMessage(
  point: AlertPoint,
  segments: RouteSegment[],
): { title: string; body: string } {
  if (point.type === 'DESTINATION') {
    return {
      title: '도착 안내',
      body: '도착지 근처입니다. 읽고 있던 책을 정리하고 쪽수를 기록하세요.',
    };
  }

  if (point.type === 'WALK') {
    const startMatch = point.id.match(/^walk-start-(\d+)$/);
    if (startMatch) {
      const idx = Number(startMatch[1]);
      const seg = segments[idx];
      return {
        title: '도보 이동 안내',
        body: seg
          ? `${seg.from}에서 ${seg.to}까지 도보로 이동해 주세요. (약 ${seg.minutes}분)`
          : `${point.name}까지 도보로 이동해 주세요.`,
      };
    }

    const endMatch = point.id.match(/^walk-(\d+)$/);
    if (endMatch) {
      const idx = Number(endMatch[1]);
      const seg = segments[idx];
      const nextSeg = segments[idx + 1];
      let after = '';
      if (nextSeg?.type === 'SUBWAY') {
        after = ` ${nextSeg.line ?? '지하철'}을 이용해 주세요.`;
      } else if (nextSeg?.type === 'BUS') {
        after = ` 버스${nextSeg.busNo ? ` ${nextSeg.busNo}` : ''}를 이용해 주세요.`;
      } else if (nextSeg?.type === 'WALK') {
        after = ' 다음 도보 구간을 이어가 주세요.';
      }
      return {
        title: '도보 이동 안내',
        body: seg
          ? `${point.name}에 도착했습니다.${after}`
          : `${point.name}까지 도보 이동을 완료했습니다.`,
      };
    }
  }

  return {
    title: '환승 안내',
    body: `이번 정류장(${point.name})에서 하차 후 환승을 준비해 주세요.`,
  };
}

/**
 * 환승·도보·도착 AlertPoint 생성.
 * - 도보 구간: 시작(walk-start) / 종료(walk) 지점
 * - 환승: 도보가 아닌 교통수단 간 전환
 */
export function buildAlertPoints(
  segments: RouteSegment[],
  destination: PlaceMarker,
  origin?: PlaceMarker | null,
  radius = DEFAULT_ALERT_RADIUS_M,
): AlertPoint[] {
  const points: AlertPoint[] = [];
  const seen = new Set<string>();

  const pushPoint = (point: Omit<AlertPoint, 'notified'>) => {
    const key = `${point.type}:${point.lat.toFixed(5)}:${point.lng.toFixed(5)}:${point.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    points.push({ ...point, notified: false });
  };

  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    if (seg.type !== 'WALK' || seg.minutes <= 0) continue;

    const startCoords = segmentWalkStartCoords(seg, i, origin);
    if (startCoords) {
      pushPoint({
        id: `walk-start-${i}`,
        type: 'WALK',
        name: seg.from,
        lat: startCoords.lat,
        lng: startCoords.lng,
        radius,
      });
    }

    const endCoords = segmentWalkEndCoords(seg, segments[i + 1]);
    if (endCoords) {
      pushPoint({
        id: `walk-${i}`,
        type: 'WALK',
        name: seg.to,
        lat: endCoords.lat,
        lng: endCoords.lng,
        radius,
      });
    }
  }

  for (let i = 1; i < segments.length; i += 1) {
    const prev = segments[i - 1];
    const curr = segments[i];
    if (prev.type === curr.type) continue;
    if (prev.type === 'WALK' || curr.type === 'WALK') continue;

    const coords = segmentJunctionCoords(prev, curr);
    if (!coords) continue;

    pushPoint({
      id: `transfer-${i}`,
      type: 'TRANSFER',
      name: curr.from || prev.to,
      lat: coords.lat,
      lng: coords.lng,
      radius,
    });
  }

  if (Number.isFinite(destination.lat) && Number.isFinite(destination.lng)) {
    pushPoint({
      id: 'destination',
      type: 'DESTINATION',
      name: destination.name?.trim() || '도착지',
      lat: destination.lat,
      lng: destination.lng,
      radius,
    });
  }

  return points;
}

export function markAlertNotified(points: AlertPoint[], id: string): AlertPoint[] {
  return points.map((p) => (p.id === id ? { ...p, notified: true } : p));
}
