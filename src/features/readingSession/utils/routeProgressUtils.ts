import type {
  AlertPoint,
  LatLng,
  PlaceMarker,
  RouteSegment,
  RouteSegmentType,
} from '@/src/features/readingSession/types/readingSession.types';
import { getRouteMovementAlertPoints } from '@/src/features/readingSession/utils/alertPointUtils';
import { haversineDistanceMeters } from '@/src/features/readingSession/utils/distance';

export type ProgressBarSegment = {
  type: RouteSegmentType;
  minutes: number;
  widthPct: number;
};

export type RouteProgressMilestone = {
  id: string;
  type: 'START' | 'WALK' | 'TRANSFER' | 'DESTINATION';
  name: string;
  positionPct: number;
  segmentIndex?: number;
  segmentType?: RouteSegmentType;
};

export type RouteProgressHeadline = {
  title: string;
  subtitle: string;
  statusLabel?: string;
  iconType: RouteSegmentType | 'DESTINATION';
};

export function buildProgressBarSegments(segments: RouteSegment[]): ProgressBarSegment[] {
  const total = segments.reduce((sum, seg) => sum + Math.max(seg.minutes, 0), 0);
  if (total <= 0) return [];

  return segments.map((seg) => ({
    type: seg.type,
    minutes: seg.minutes,
    widthPct: (Math.max(seg.minutes, 0) / total) * 100,
  }));
}

export function buildRouteProgressMilestones(
  segments: RouteSegment[],
  alertPoints: AlertPoint[],
): RouteProgressMilestone[] {
  const total = segments.reduce((sum, seg) => sum + Math.max(seg.minutes, 0), 0);
  if (total <= 0 || segments.length === 0) {
    return [{ id: 'start', type: 'START', name: '출발', positionPct: 0 }];
  }

  const milestones: RouteProgressMilestone[] = [
    {
      id: 'start',
      type: 'START',
      name: segments[0].from,
      positionPct: 0,
      segmentType: segments[0].type,
    },
  ];

  let cumulative = 0;
  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    cumulative += Math.max(seg.minutes, 0);

    if (seg.type === 'WALK') {
      const walkEnd = alertPoints.find((p) => p.id === `walk-${i}`);
      milestones.push({
        id: walkEnd?.id ?? `walk-${i}`,
        type: 'WALK',
        name: walkEnd?.name ?? seg.to,
        positionPct: Math.min(100, (cumulative / total) * 100),
        segmentIndex: i,
        segmentType: 'WALK',
      });
      continue;
    }
  }

  cumulative = 0;
  for (let i = 1; i < segments.length; i += 1) {
    const prev = segments[i - 1];
    const curr = segments[i];
    cumulative += Math.max(prev.minutes, 0);
    if (prev.type === curr.type) continue;
    if (prev.type === 'WALK' || curr.type === 'WALK') continue;

    const transfer = alertPoints.find((p) => p.id === `transfer-${i}`);
    milestones.push({
      id: transfer?.id ?? `transfer-${i}`,
      type: 'TRANSFER',
      name: transfer?.name ?? curr.from,
      positionPct: Math.min(100, (cumulative / total) * 100),
      segmentIndex: i,
      segmentType: curr.type,
    });
  }

  const destination = alertPoints.find((p) => p.type === 'DESTINATION');
  milestones.push({
    id: destination?.id ?? 'destination',
    type: 'DESTINATION',
    name: destination?.name ?? segments[segments.length - 1].to,
    positionPct: 100,
    segmentType: segments[segments.length - 1].type,
  });

  const start = milestones.filter((m) => m.type === 'START');
  const rest = milestones
    .filter((m) => m.type !== 'START')
    .sort((a, b) => a.positionPct - b.positionPct);
  return [...start, ...rest];
}

export function getReachedMilestoneIndex(
  milestones: RouteProgressMilestone[],
  alertPoints: AlertPoint[],
): number {
  let reached = 0;
  for (let i = 0; i < milestones.length; i += 1) {
    const milestone = milestones[i];
    if (milestone.type === 'START') continue;
    const point = alertPoints.find((p) => p.id === milestone.id);
    if (point?.notified) {
      reached = i;
    }
  }
  return reached;
}

export function getArrowPositionPct(
  milestones: RouteProgressMilestone[],
  reachedIndex: number,
  opts?: {
    currentLocation?: LatLng | null;
    waypoints?: LatLng[];
  },
): number {
  if (milestones.length === 0) return 0;

  if (opts?.currentLocation && opts.waypoints && opts.waypoints.length >= 2) {
    return getProgressPctAlongWaypoints(opts.currentLocation, opts.waypoints);
  }

  return milestones[reachedIndex]?.positionPct ?? 0;
}

export function buildRouteWaypoints(
  origin: PlaceMarker | null,
  alertPoints: AlertPoint[],
  destination: PlaceMarker | null,
): LatLng[] {
  const waypoints: LatLng[] = [];
  if (origin) waypoints.push({ lat: origin.lat, lng: origin.lng });
  getRouteMovementAlertPoints(alertPoints).forEach((p) => {
    waypoints.push({ lat: p.lat, lng: p.lng });
  });
  if (destination) waypoints.push({ lat: destination.lat, lng: destination.lng });
  return waypoints;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function projectParamOnSegment(p: LatLng, a: LatLng, b: LatLng): number {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return 0;
  return ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / len2;
}

/** 경로 waypoint polyline 상에서 현재 위치의 진행률(0~100) */
export function getProgressPctAlongWaypoints(location: LatLng, waypoints: LatLng[]): number {
  if (waypoints.length < 2) return 0;

  const segLens: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const d = haversineDistanceMeters(waypoints[i], waypoints[i + 1]);
    segLens.push(d);
    totalLen += d;
  }
  if (totalLen <= 0) return 0;

  let bestPct = 0;
  let bestDist = Infinity;
  let accum = 0;

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segLen = segLens[i];
    const t = clamp(projectParamOnSegment(location, a, b), 0, 1);
    const proj = {
      lat: a.lat + t * (b.lat - a.lat),
      lng: a.lng + t * (b.lng - a.lng),
    };
    const dist = haversineDistanceMeters(location, proj);
    if (dist < bestDist) {
      bestDist = dist;
      bestPct = ((accum + segLen * t) / totalLen) * 100;
    }
    accum += segLen;
  }

  return clamp(bestPct, 0, 100);
}

function headlineForActiveSegment(seg: RouteSegment): RouteProgressHeadline {
  if (seg.type === 'WALK') {
    return {
      title: `${seg.from}에서 ${seg.to}까지 도보`,
      subtitle: `도보 약 ${seg.minutes}분`,
      iconType: 'WALK',
    };
  }
  if (seg.type === 'SUBWAY') {
    return {
      title: `${seg.from} → ${seg.to}`,
      subtitle: `${seg.line ?? '지하철'} 이용 중`,
      iconType: 'SUBWAY',
    };
  }
  return {
    title: `${seg.from} → ${seg.to}`,
    subtitle: seg.busNo ? `버스 ${seg.busNo} 이용 중` : '버스 이용 중',
    iconType: 'BUS',
  };
}

function headlineAfterReachedMilestone(
  segments: RouteSegment[],
  reached: RouteProgressMilestone,
): RouteProgressHeadline | null {
  if (reached.type === 'WALK' && reached.segmentIndex != null) {
    const nextSeg = segments[reached.segmentIndex + 1];
    if (!nextSeg) return null;
    if (nextSeg.type === 'SUBWAY') {
      return {
        title: `${reached.name} · 지하철 탑승`,
        subtitle: `${nextSeg.line ?? '지하철'} · ${nextSeg.to} 방향`,
        iconType: 'SUBWAY',
      };
    }
    if (nextSeg.type === 'BUS') {
      return {
        title: `${reached.name} · 버스 탑승`,
        subtitle: nextSeg.busNo ? `버스 ${nextSeg.busNo} · ${nextSeg.to} 방향` : `${nextSeg.to} 방향`,
        iconType: 'BUS',
      };
    }
    if (nextSeg.type === 'WALK') {
      return {
        title: `${reached.name} 도착`,
        subtitle: `다음 도보 · ${nextSeg.to}까지 약 ${nextSeg.minutes}분`,
        iconType: 'WALK',
      };
    }
  }

  if (reached.type === 'TRANSFER' && reached.segmentIndex != null) {
    const prevSeg = segments[reached.segmentIndex - 1];
    const currSeg = segments[reached.segmentIndex];
    if (!prevSeg || !currSeg) return null;
    const walkAfter =
      currSeg.type === 'WALK'
        ? `하차 후 도보 ${currSeg.minutes}분`
        : currSeg.type === 'SUBWAY'
          ? `${currSeg.line ?? '지하철'} 환승`
          : currSeg.busNo
            ? `버스 ${currSeg.busNo} 환승`
            : '버스 환승';
    return {
      title: `${prevSeg.to} 정거장 하차`,
      subtitle: walkAfter,
      iconType: prevSeg.type,
    };
  }

  return null;
}

function getActiveSegmentIndex(
  segments: RouteSegment[],
  milestones: RouteProgressMilestone[],
  reachedIndex: number,
): number {
  const reached = milestones[reachedIndex];
  if (!reached || reached.type === 'START') return 0;
  if (reached.type === 'DESTINATION') return Math.max(0, segments.length - 1);
  if (reached.segmentIndex != null) {
    if (reached.type === 'WALK') {
      return Math.min(reached.segmentIndex + 1, segments.length - 1);
    }
    return Math.min(reached.segmentIndex, segments.length - 1);
  }
  return 0;
}

export function getRouteProgressHeadline(
  segments: RouteSegment[],
  milestones: RouteProgressMilestone[],
  reachedIndex: number,
): RouteProgressHeadline {
  const fallback: RouteProgressHeadline = {
    title: '이동 경로 안내',
    subtitle: '다음 환승·도착 안내를 기다려 주세요.',
    iconType: 'WALK',
  };

  if (segments.length === 0 || milestones.length === 0) {
    return fallback;
  }

  const safeReached = Math.min(Math.max(0, reachedIndex), milestones.length - 1);
  const reached = milestones[safeReached];

  if (reached.type === 'DESTINATION') {
    return {
      title: `${reached.name} 도착`,
      subtitle: '독서 세션을 마무리하고 쪽수를 기록하세요',
      statusLabel: '도착',
      iconType: 'DESTINATION',
    };
  }

  const afterMilestone = headlineAfterReachedMilestone(segments, reached);
  if (afterMilestone) {
    return afterMilestone;
  }

  const activeSeg = segments[getActiveSegmentIndex(segments, milestones, safeReached)];
  if (activeSeg) {
    return headlineForActiveSegment(activeSeg);
  }

  return fallback;
}
