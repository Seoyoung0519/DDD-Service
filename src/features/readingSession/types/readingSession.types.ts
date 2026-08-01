export const DEFAULT_ALERT_RADIUS_M = 300;

export type LatLng = {
  lat: number;
  lng: number;
};

export type PlaceMarker = LatLng & {
  name?: string;
};

export type RouteSegmentType = 'WALK' | 'SUBWAY' | 'BUS';

export type RouteStation = {
  lat?: number;
  lng?: number;
  name?: string;
};

export type RouteSegment = {
  type: RouteSegmentType;
  minutes: number;
  from: string;
  to: string;
  line?: string;
  busNo?: string;
  wayCode?: number;
  subwayCode?: number;
  busType?: number;
  busLocalBlID?: string;
  fromStation?: RouteStation | null;
  toStation?: RouteStation | null;
};

export type AlertPointType = 'WALK' | 'TRANSFER' | 'DESTINATION';

export type AlertPoint = {
  id: string;
  type: AlertPointType;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  notified: boolean;
};

export type MovementAlert = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  kind: 'WALK' | 'TRANSFER' | 'DESTINATION' | 'INFO';
};

export type ReadingSessionBootstrap = {
  sessionId: string;
  userId: string;
  startTime: string;
  origin: PlaceMarker;
  destination: PlaceMarker;
  routeSegments: RouteSegment[];
  plannedPages: number;
  travelMinutes: number;
  bookTitle: string;
  bookAuthors?: string;
  bookCoverUrl?: string | null;
  bookId: string;
  userBookId: string;
  startPage: number;
  endPage: number;
};

export type FinishReadingSessionRequest = {
  sessionId: string;
  userId: string;
  endPage: number;
  actualMinutes: number;
};

export type ReadingSessionState = {
  isSessionActive: boolean;
  sessionId: string | null;
  startTime: string | null;
  currentLocation: LatLng | null;
  origin: PlaceMarker | null;
  destination: PlaceMarker | null;
  routeSegments: RouteSegment[];
  alertPoints: AlertPoint[];
  readingDurationMinutes: number;
  plannedPages: number;
  travelMinutes: number;
  bookTitle: string;
  bookCoverUrl?: string | null;
  movementAlerts: MovementAlert[];
  locationError: string | null;
  permissionsReady: boolean;
  userId: string | null;
  sessionStartPage: number;
  sessionEndPage: number;
};
