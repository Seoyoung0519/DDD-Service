import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import {
  shouldNotifyProximity,
} from '@/src/features/readingSession/services/notificationService';
import type {
  AlertPoint,
  LatLng,
  MovementAlert,
  ReadingSessionBootstrap,
  ReadingSessionState,
  RouteSegment,
} from '@/src/features/readingSession/types/readingSession.types';
import {
  buildAlertPoints,
  getMovementAlertMessage,
  markAlertNotified,
} from '@/src/features/readingSession/utils/alertPointUtils';
import { isWithinRadiusMeters } from '@/src/features/readingSession/utils/distance';
import {
  buildProgressBarSegments,
  buildRouteProgressMilestones,
  buildRouteWaypoints,
  getArrowPositionPct,
  getReachedMilestoneIndex,
  getRouteProgressHeadline,
} from '@/src/features/readingSession/utils/routeProgressUtils';
import { consumeReadingSessionBootstrap } from '@/src/state/activeReadingSessionBootstrap';
import {
  notifyCommuteProximityOnDevice,
  requestDeviceNotificationPermission,
} from '@/src/services/push/deviceNotificationService';
import { setReadingSessionFinishPayload } from '@/src/state/readingSessionFinishFlow';
import {
  buildDemoAlertPoints,
  buildDemoWaypoints,
  getAlertPointForDemoStep,
  isDemoCommuteLocationEnabled,
  prepareRouteSegmentsForDemo,
  startDemoLocationSimulation,
} from '@/src/features/readingSession/services/demoLocationService';
import {
  requestLocationPermissions,
  showLocationPermissionAlert,
  startLocationWatch,
  stopLocationWatch,
} from '@/src/features/readingSession/services/locationService';

const INITIAL_STATE: ReadingSessionState = {
  isSessionActive: false,
  sessionId: null,
  startTime: null,
  currentLocation: null,
  origin: null,
  destination: null,
  routeSegments: [],
  alertPoints: [],
  readingDurationMinutes: 0,
  plannedPages: 0,
  travelMinutes: 0,
  bookTitle: '',
  bookCoverUrl: null,
  movementAlerts: [],
  locationError: null,
  permissionsReady: false,
  userId: null,
  sessionStartPage: 0,
  sessionEndPage: 0,
};

function formatClock(iso: string | null): string {
  if (!iso) return '--:--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function relativeTimeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '지금';
  if (minutes < 60) return `${minutes}분전`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간전`;
}

async function fireAlertForPoint(
  point: AlertPoint,
  segments: RouteSegment[],
): Promise<{ alert: MovementAlert; pointId: string } | null> {
  if (point.notified || !shouldNotifyProximity(point.id)) return null;

  const { title, body } = getMovementAlertMessage(point, segments);

  await notifyCommuteProximityOnDevice({
    kind: point.type,
    body,
    pointId: point.id,
  });

  return {
    pointId: point.id,
    alert: {
      id: `${point.id}-${Date.now()}`,
      title,
      body,
      createdAt: new Date().toISOString(),
      kind: point.type,
    },
  };
}

async function processProximityAlerts(
  location: LatLng,
  alertPoints: AlertPoint[],
  segments: RouteSegment[],
): Promise<{ alertPoints: AlertPoint[]; newAlerts: MovementAlert[] }> {
  let nextPoints = alertPoints;
  const newAlerts: MovementAlert[] = [];

  for (const point of alertPoints) {
    if (point.notified) continue;
    if (!isWithinRadiusMeters(location, point, point.radius)) continue;

    const fired = await fireAlertForPoint(point, segments);
    if (!fired) continue;

    nextPoints = markAlertNotified(nextPoints, point.id);
    newAlerts.push(fired.alert);
  }

  return { alertPoints: nextPoints, newAlerts };
}

export function useReadingSession() {
  const router = useRouter();
  const bootstrap = useMemo(() => consumeReadingSessionBootstrap(), []);

  const [state, setState] = useState<ReadingSessionState>(INITIAL_STATE);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [beginningFinishFlow, setBeginningFinishFlow] = useState(false);

  const watchRef = useRef<Awaited<ReturnType<typeof startLocationWatch>> | null>(null);
  const demoRef = useRef<ReturnType<typeof startDemoLocationSimulation> | null>(null);
  const sessionActiveRef = useRef(false);
  const finishFlowStartedRef = useRef(false);
  const autoFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootstrapRef = useRef<ReadingSessionBootstrap | null>(bootstrap);
  const alertPointsRef = useRef<AlertPoint[]>([]);
  const routeSegmentsRef = useRef<RouteSegment[]>([]);
  const beginFinishFlowRef = useRef<() => Promise<void>>(async () => {});

  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [demoTotalSteps, setDemoTotalSteps] = useState(0);
  const isDemoLocation = isDemoCommuteLocationEnabled();

  const stopWatch = useCallback(async () => {
    demoRef.current?.stop();
    demoRef.current = null;
    await stopLocationWatch(watchRef.current);
    watchRef.current = null;
  }, []);

  const beginFinishFlow = useCallback(async () => {
    if (finishFlowStartedRef.current || !state.sessionId || !state.userId) return;
    finishFlowStartedRef.current = true;
    setBeginningFinishFlow(true);

    if (autoFinishTimerRef.current) {
      clearTimeout(autoFinishTimerRef.current);
      autoFinishTimerRef.current = null;
    }

    await stopWatch();
    sessionActiveRef.current = false;

    const elapsedMs = state.startTime
      ? Date.now() - new Date(state.startTime).getTime()
      : 0;
    const actualMinutes = Math.max(0, Math.round(elapsedMs / 60_000));
    const boot = bootstrapRef.current;

    setReadingSessionFinishPayload({
      sessionId: state.sessionId,
      userId: state.userId,
      userBookId: boot?.userBookId ?? '',
      bookId: boot?.bookId ?? '',
      bookTitle: state.bookTitle,
      bookCoverUrl: state.bookCoverUrl ?? null,
      authors: boot?.bookAuthors ?? '',
      sessionStartPage: state.sessionStartPage,
      sessionEndPage: state.sessionEndPage,
      plannedPages: state.plannedPages,
      actualMinutes,
      travelMinutes: state.travelMinutes,
    });

    setState((prev) => ({ ...prev, isSessionActive: false }));
    setBeginningFinishFlow(false);
    router.push('/ReadingSessionFinishFlowScreen');
  }, [
    router,
    state.bookCoverUrl,
    state.bookTitle,
    state.plannedPages,
    state.sessionEndPage,
    state.sessionId,
    state.sessionStartPage,
    state.startTime,
    state.travelMinutes,
    state.userId,
    stopWatch,
  ]);

  beginFinishFlowRef.current = beginFinishFlow;

  const scheduleAutoFinishOnDestination = useCallback(() => {
    if (finishFlowStartedRef.current || autoFinishTimerRef.current) return;
    autoFinishTimerRef.current = setTimeout(() => {
      autoFinishTimerRef.current = null;
      void beginFinishFlowRef.current();
    }, 5000);
  }, []);

  const maybeScheduleDestinationFinish = useCallback(
    (alerts: MovementAlert[]) => {
      if (alerts.some((a) => a.kind === 'DESTINATION')) {
        scheduleAutoFinishOnDestination();
      }
    },
    [scheduleAutoFinishOnDestination],
  );

  const handleLocationUpdate = useCallback(async (location: LatLng) => {
    const { alertPoints, newAlerts } = await processProximityAlerts(
      location,
      alertPointsRef.current,
      routeSegmentsRef.current,
    );
    alertPointsRef.current = alertPoints;

    setState((prev) => {
      const next: Partial<ReadingSessionState> = {
        currentLocation: location,
        alertPoints,
      };
      if (newAlerts.length > 0) {
        next.movementAlerts = [...newAlerts, ...prev.movementAlerts];
        maybeScheduleDestinationFinish(newAlerts);
      }
      return { ...prev, ...next };
    });
  }, [maybeScheduleDestinationFinish]);

  const activateSession = useCallback(
    async (payload: ReadingSessionBootstrap) => {
      if (sessionActiveRef.current) return;
      sessionActiveRef.current = true;

      const locationPerm = await requestLocationPermissions();
      if (!locationPerm.ok && !isDemoLocation) {
        sessionActiveRef.current = false;
        showLocationPermissionAlert(locationPerm.message ?? '위치 권한이 필요합니다.');
        router.back();
        return;
      }
      if (locationPerm.message && !isDemoLocation) {
        Alert.alert('안내', locationPerm.message);
      }

      void requestDeviceNotificationPermission();

      const routeSegments = isDemoLocation
        ? prepareRouteSegmentsForDemo(
            payload.routeSegments,
            payload.origin,
            payload.destination,
          )
        : payload.routeSegments;

      const alertPoints = isDemoLocation
        ? buildDemoAlertPoints(routeSegments, payload.origin, payload.destination)
        : buildAlertPoints(routeSegments, payload.destination, payload.origin);
      alertPointsRef.current = alertPoints;
      routeSegmentsRef.current = routeSegments;
      const travelSeconds = Math.max(payload.travelMinutes, 1) * 60;
      setRemainingSeconds(travelSeconds);

      setState({
        isSessionActive: true,
        sessionId: payload.sessionId,
        startTime: payload.startTime,
        currentLocation: null,
        origin: payload.origin,
        destination: payload.destination,
        routeSegments: routeSegments,
        alertPoints,
        readingDurationMinutes: 0,
        plannedPages: payload.plannedPages,
        travelMinutes: payload.travelMinutes,
        bookTitle: payload.bookTitle,
        bookCoverUrl: payload.bookCoverUrl,
        movementAlerts: [],
        locationError: null,
        permissionsReady: true,
        userId: payload.userId,
        sessionStartPage: payload.startPage,
        sessionEndPage: payload.endPage,
      });

      try {
        if (isDemoLocation) {
          const waypoints = buildDemoWaypoints(
            payload.origin,
            alertPoints,
            payload.destination,
          );
          setDemoTotalSteps(waypoints.length);
          setDemoStepIndex(0);
          demoRef.current = startDemoLocationSimulation(
            waypoints,
            (loc) => {
              setDemoStepIndex(demoRef.current?.getStep() ?? 0);
              setState((prev) => ({ ...prev, currentLocation: loc }));
            },
            0,
          );
        } else {
          watchRef.current = await startLocationWatch((loc) => {
            void handleLocationUpdate(loc);
          });
        }

        const walkStart = alertPoints.find((p) => p.id === 'walk-start-0');
        if (walkStart && routeSegments[0]?.type === 'WALK') {
          const fired = await fireAlertForPoint(walkStart, routeSegments);
          if (fired) {
            alertPointsRef.current = markAlertNotified(alertPointsRef.current, fired.pointId);
            setState((prev) => ({
              ...prev,
              alertPoints: alertPointsRef.current,
              movementAlerts: [fired.alert, ...prev.movementAlerts],
            }));
          }
        }
      } catch (e: unknown) {
        sessionActiveRef.current = false;
        const raw =
          typeof e === 'object' && e != null && 'message' in e
            ? String((e as { message: unknown }).message)
            : '위치 추적을 시작하지 못했습니다.';
        const needsRebuild =
          raw.includes('ExpoLocation') || raw.includes('native module');
        const msg = needsRebuild
          ? '위치 모듈이 설치되지 않았습니다. Metro를 재시작한 뒤 `npm run android`로 앱을 다시 빌드해 주세요.'
          : raw;
        setState((prev) => ({ ...prev, isSessionActive: false, locationError: msg }));
        Alert.alert('위치 추적 실패', msg, [
          { text: '확인', onPress: () => router.back() },
        ]);
      }
    },
    [handleLocationUpdate, isDemoLocation, router],
  );

  useEffect(() => {
    if (!bootstrapRef.current) {
      Alert.alert('세션 정보 없음', '독서 세션을 다시 시작해 주세요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
      return;
    }
    void activateSession(bootstrapRef.current);
    return () => {
      if (autoFinishTimerRef.current) {
        clearTimeout(autoFinishTimerRef.current);
      }
      void stopWatch();
    };
  }, [activateSession, router, stopWatch]);

  useEffect(() => {
    if (!state.isSessionActive || !state.startTime) return undefined;

    const tick = () => {
      const startedMs = new Date(state.startTime!).getTime();
      const elapsedSec = Math.floor((Date.now() - startedMs) / 1000);
      const totalSec = Math.max(state.travelMinutes, 1) * 60;
      setRemainingSeconds(Math.max(0, totalSec - elapsedSec));
      setState((prev) => ({
        ...prev,
        readingDurationMinutes: Math.max(0, Math.round(elapsedSec / 60)),
      }));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.isSessionActive, state.startTime, state.travelMinutes]);

  const transferMarkers = useMemo(
    () => state.alertPoints.filter((p) => p.type === 'TRANSFER' || p.type === 'WALK'),
    [state.alertPoints],
  );

  const routeProgressMilestones = useMemo(
    () => buildRouteProgressMilestones(state.routeSegments, state.alertPoints),
    [state.routeSegments, state.alertPoints],
  );

  const routeProgressBarSegments = useMemo(
    () => buildProgressBarSegments(state.routeSegments),
    [state.routeSegments],
  );

  const reachedMilestoneIndex = useMemo(
    () => getReachedMilestoneIndex(routeProgressMilestones, state.alertPoints),
    [routeProgressMilestones, state.alertPoints],
  );

  const routeWaypoints = useMemo(
    () => buildRouteWaypoints(state.origin, state.alertPoints, state.destination),
    [state.origin, state.alertPoints, state.destination],
  );

  const progressLocation = useMemo(() => {
    if (isDemoLocation) {
      if (routeWaypoints.length === 0) return null;
      const idx = Math.min(demoStepIndex, routeWaypoints.length - 1);
      return routeWaypoints[idx];
    }
    return state.currentLocation;
  }, [isDemoLocation, demoStepIndex, routeWaypoints, state.currentLocation]);

  const routeProgressHeadline = useMemo(
    () =>
      getRouteProgressHeadline(
        state.routeSegments,
        routeProgressMilestones,
        reachedMilestoneIndex,
      ),
    [state.routeSegments, routeProgressMilestones, reachedMilestoneIndex],
  );

  const arrowPositionPct = useMemo(
    () =>
      getArrowPositionPct(routeProgressMilestones, reachedMilestoneIndex, {
        currentLocation: progressLocation,
        waypoints: routeWaypoints,
      }),
    [routeProgressMilestones, reachedMilestoneIndex, progressLocation, routeWaypoints],
  );

  const advanceDemoLocation = useCallback(async () => {
    if (!demoRef.current || demoTotalSteps <= 0) return;
    const prevStep = demoRef.current.getStep();
    if (prevStep >= demoTotalSteps - 1) return;

    demoRef.current.advance();
    const step = demoRef.current.getStep();
    const loc = demoRef.current.getCurrentLocation();
    setDemoStepIndex(step);

    const point = getAlertPointForDemoStep(step, demoTotalSteps, alertPointsRef.current);
    const fired = point ? await fireAlertForPoint(point, routeSegmentsRef.current) : null;

    const nextPoints = fired
      ? markAlertNotified(alertPointsRef.current, fired.pointId)
      : alertPointsRef.current;
    alertPointsRef.current = nextPoints;

    setState((prev) => ({
      ...prev,
      currentLocation: loc ?? prev.currentLocation,
      alertPoints: nextPoints,
      movementAlerts: fired ? [fired.alert, ...prev.movementAlerts] : prev.movementAlerts,
    }));

    if (fired?.alert.kind === 'DESTINATION') {
      scheduleAutoFinishOnDestination();
    }
  }, [demoTotalSteps, scheduleAutoFinishOnDestination]);

  return {
    state,
    beginningFinishFlow,
    remainingSeconds,
    remainingLabel: formatCountdown(remainingSeconds),
    startTimeLabel: formatClock(state.startTime),
    relativeTimeLabel,
    beginFinishFlow,
    transferMarkers,
    routeProgress: {
      headline: routeProgressHeadline,
      barSegments: routeProgressBarSegments,
      milestones: routeProgressMilestones,
      arrowPositionPct,
      reachedMilestoneIndex,
    },
    isDemoLocation,
    demoStepIndex,
    demoTotalSteps,
    advanceDemoLocation,
  };
}
