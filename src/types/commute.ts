/** 출·도착지 장소 검색 — 앱에서 사용하는 정규화 형태 (API `data.places[]` 기준) */
export type CommutePlace = {
  placeId: string;
  /** 표시용 이름 — API `name` */
  label: string;
  /** 도로명/지번 — API `address` */
  subtitle?: string;
  lat?: number;
  lng?: number;
  /** 장소 유형(예: 아파트) — API가 주면 목록 우측에 표시 */
  category?: string;
  /** 현재 위치 기준 거리(m) — API가 주면 우측 하단에 표시 */
  distanceMeters?: number;
};

/** GET /api/commute/places/search 응답 (문서 3-3) */
export type CommutePlacesSearchApiResponse = {
  success: boolean;
  data?: {
    places?: CommutePlaceApiItem[];
  } | null;
  error?: string | null;
};

export type CommutePlaceApiItem = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  distanceMeters?: number;
};
