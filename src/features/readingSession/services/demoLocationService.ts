import type {
  AlertPoint,
  LatLng,
  PlaceMarker,
  RouteSegment,
} from '@/src/features/readingSession/types/readingSession.types';
import { DEFAULT_ALERT_RADIUS_M } from '@/src/features/readingSession/types/readingSession.types';
import {
  buildAlertPoints,
  getRouteMovementAlertPoints,
} from '@/src/features/readingSession/utils/alertPointUtils';

/** 에뮬레이터·실기기에서 GPS 대신 경로 지점을 순서대로 시뮬레이션 */
export function isDemoCommuteLocationEnabled(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_DEMO_COMMUTE_LOCATION === 'true';
}

function interpolateLatLng(from: LatLng, to: LatLng, t: number): LatLng {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

function segmentHasStationCoords(segments: RouteSegment[]): boolean {
  return segments.some((seg) => {
    const fromLat = seg.fromStation?.lat;
    const toLat = seg.toStation?.lat;
    return Number.isFinite(fromLat) || Number.isFinite(toLat);
  });
}

/** API 경로에 정류장 좌표가 없을 때 출·도착 사이 보간 좌표를 채움 (에뮬레이터 데모용) */
export function prepareRouteSegmentsForDemo(
  segments: RouteSegment[],
  origin: PlaceMarker,
  destination: PlaceMarker,
): RouteSegment[] {
  if (segments.length === 0 || segmentHasStationCoords(segments)) {
    return segments;
  }

  const count = segments.length;
  return segments.map((seg, index) => {
    const fromCoords = interpolateLatLng(origin, destination, index / count);
    const toCoords = interpolateLatLng(origin, destination, (index + 1) / count);
    return {
      ...seg,
      fromStation: seg.fromStation ?? {
        lat: fromCoords.lat,
        lng: fromCoords.lng,
        name: seg.from,
      },
      toStation: seg.toStation ?? {
        lat: toCoords.lat,
        lng: toCoords.lng,
        name: seg.to,
      },
    };
  });
}

/**
 * API segments에 정류장 좌표가 없을 때 데모용 환승·도보 지점을 출·도착 사이에 보간 생성.
 */
export function buildDemoAlertPoints(
  segments: RouteSegment[],
  origin: PlaceMarker,
  destination: PlaceMarker,
): AlertPoint[] {
  const base = buildAlertPoints(segments, destination, origin);
  if (base.some((p) => p.type === 'TRANSFER' || p.type === 'WALK')) return base;

  const modeChangeIndices: number[] = [];
  for (let i = 1; i < segments.length; i += 1) {
    if (segments[i - 1].type !== segments[i].type) {
      modeChangeIndices.push(i);
    }
  }

  const points: AlertPoint[] = [];
  modeChangeIndices.forEach((segIdx, idx) => {
    const t = (idx + 1) / (modeChangeIndices.length + 1);
    const coords = interpolateLatLng(origin, destination, t);
    const seg = segments[segIdx];
    const isWalk = seg.type === 'WALK' || segments[segIdx - 1]?.type === 'WALK';
    points.push({
      id: isWalk ? `walk-${segIdx - 1}` : `transfer-${segIdx}`,
      type: isWalk ? 'WALK' : 'TRANSFER',
      name: isWalk ? segments[segIdx - 1]?.to ?? seg.from : seg.from,
      lat: coords.lat,
      lng: coords.lng,
      radius: DEFAULT_ALERT_RADIUS_M,
      notified: false,
    });
  });

  const dest = base.find((p) => p.type === 'DESTINATION');
  if (dest) {
    points.push(dest);
  } else {
    points.push({
      id: 'destination',
      type: 'DESTINATION',
      name: destination.name?.trim() || '도착지',
      lat: destination.lat,
      lng: destination.lng,
      radius: DEFAULT_ALERT_RADIUS_M,
      notified: false,
    });
  }

  return points;
}

export function buildDemoWaypoints(
  origin: PlaceMarker,
  alertPoints: AlertPoint[],
  destination: PlaceMarker,
): LatLng[] {
  const waypoints: LatLng[] = [{ lat: origin.lat, lng: origin.lng }];

  getRouteMovementAlertPoints(alertPoints).forEach((p) => {
    waypoints.push({ lat: p.lat, lng: p.lng });
  });

  waypoints.push({ lat: destination.lat, lng: destination.lng });
  return waypoints;
}

type DemoLocationHandle = {
  stop: () => void;
  advance: () => void;
  getStep: () => number;
  getCurrentLocation: () => LatLng | null;
};

/**
 * 데모 위치 시뮬레이션 — 각 waypoint에 도달하면 onUpdate 호출.
 * @param intervalMs 자동 진행 간격 (0이면 수동 버튼만)
 */
export function startDemoLocationSimulation(
  waypoints: LatLng[],
  onUpdate: (location: LatLng) => void,
  intervalMs = 0,
): DemoLocationHandle {
  let step = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = () => {
    if (waypoints.length === 0) return;
    const idx = Math.min(step, waypoints.length - 1);
    onUpdate(waypoints[idx]);
  };

  emit();

  if (intervalMs > 0) {
    timer = setInterval(() => {
      if (step < waypoints.length - 1) {
        step += 1;
        emit();
      }
    }, intervalMs);
  }

  return {
    stop: () => {
      if (timer) clearInterval(timer);
      timer = null;
    },
    advance: () => {
      if (step < waypoints.length - 1) {
        step += 1;
        emit();
      } else {
        emit();
      }
    },
    getStep: () => step,
    getCurrentLocation: () => {
      if (waypoints.length === 0) return null;
      return waypoints[Math.min(step, waypoints.length - 1)];
    },
  };
}

/** 데모 waypoint 단계에 해당하는 AlertPoint */
export function getAlertPointForDemoStep(
  stepIndex: number,
  totalSteps: number,
  alertPoints: AlertPoint[],
): AlertPoint | null {
  if (stepIndex <= 0 || totalSteps <= 1) return null;

  const movement = getRouteMovementAlertPoints(alertPoints);
  const destination = alertPoints.find((p) => p.type === 'DESTINATION') ?? null;

  if (stepIndex >= totalSteps - 1) return destination;
  return movement[stepIndex - 1] ?? null;
}
