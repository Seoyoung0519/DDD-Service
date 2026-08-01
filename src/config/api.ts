// src/config/api.ts
/**
 * 로그인/인증 서버 (토큰 발급, /api/auth/*)
 * - env로 오버라이드 가능
 */
export const LOGIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_LOGIN_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://daedokdan-login.onrender.com';

/**
 * 메인 API 서버 (읽기/책장/검색/책 상세 등 — Axios client, authedFetch)
 * - env로 오버라이드 가능
 */
export const MAIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_MAIN_API_BASE_URL ??
  'https://daedokdan-api.onrender.com';

/** 메인 배너 API (`/api/banners`, `/api/admin/banners`) */
export const BANNER_API_BASE_URL =
  process.env.EXPO_PUBLIC_BANNER_API_BASE_URL ??
  'https://daedokdan-api.onrender.com';

/** 관리자 콘텐츠 API (`/api/admin/*`) */
export const ADMIN_API_BASE_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_BASE_URL ??
  'https://daedokdan-api.onrender.com';

/** 온보딩·키링 등 확장 API 기본 호스트: https://daedokdan-api-8s8k.onrender.com */
const EXTENDED_API_BASE_URL = 'https://daedokdan-api-8s8k.onrender.com';

/**
 * 설정 API (`/settings/*`, `/agreements/*`)
 * - env: EXPO_PUBLIC_SETTINGS_API_BASE_URL
 */
export const SETTINGS_API_BASE_URL =
  process.env.EXPO_PUBLIC_SETTINGS_API_BASE_URL ?? EXTENDED_API_BASE_URL;

/**
 * 온보딩 API (`/onboarding/*`)
 * - env: EXPO_PUBLIC_ONBOARDING_API_BASE_URL
 */
export const ONBOARDING_API_BASE_URL =
  process.env.EXPO_PUBLIC_ONBOARDING_API_BASE_URL ?? EXTENDED_API_BASE_URL;

/**
 * 키링 API — 메인에는 `/keyrings` 미구현 시 이 호스트 사용
 * - env: EXPO_PUBLIC_KEYRING_API_BASE_URL
 */
export const KEYRING_API_BASE_URL =
  process.env.EXPO_PUBLIC_KEYRING_API_BASE_URL ?? EXTENDED_API_BASE_URL;

/**
 * 내 서재 확장 API (`/library/*` 등)
 * - 기본: https://daedokdan-api-8s8k.onrender.com
 * - env: EXPO_PUBLIC_LIBRARY_API_BASE_URL
 */
export const LIBRARY_API_BASE_URL =
  process.env.EXPO_PUBLIC_LIBRARY_API_BASE_URL ?? EXTENDED_API_BASE_URL;

/**
 * 사용자 프로필 API (`/user/profile` 등)
 * - env: EXPO_PUBLIC_USER_API_BASE_URL
 */
export const USER_API_BASE_URL =
  process.env.EXPO_PUBLIC_USER_API_BASE_URL ?? EXTENDED_API_BASE_URL;

/**
 * 찜하기 추가 요청 경로 (확장 API). `GET /library/wishlist`와 달리 보통 POST는 하위 경로.
 * 405 Method Not Allowed 시 백엔드 스펙에 맞게 이 값을 설정 (예: `/library/wishlist/add`).
 */
export const LIBRARY_WISHLIST_ADD_PATH =
  process.env.EXPO_PUBLIC_LIBRARY_WISHLIST_ADD_PATH ?? '/library/wishlist/items';

/**
 * POST /badges/keyring 요청 본문의 책 ID 필드명.
 * - 기본: `bookId` (camelCase JSON)
 * - snake_case가 필요하면: `EXPO_PUBLIC_KEYRING_CREATE_BOOK_ID_JSON_KEY=book_id`
 */
export const KEYRING_CREATE_BOOK_ID_JSON_KEY: 'book_id' | 'bookId' =
  process.env.EXPO_PUBLIC_KEYRING_CREATE_BOOK_ID_JSON_KEY === 'book_id'
    ? 'book_id'
    : 'bookId';

/**
 * 독서 인증샷 API (`POST /proofs/upload`)
 * - env: EXPO_PUBLIC_PROOF_API_BASE_URL
 * - 기본: 확장 API (메인 API에는 해당 경로 없음 → 404)
 */
export const PROOF_API_BASE_URL =
  process.env.EXPO_PUBLIC_PROOF_API_BASE_URL ?? EXTENDED_API_BASE_URL;

/**
 * Backward-compat: 기존 코드가 기대하는 API_BASE_URL은 로그인 서버로 유지.
 */
export const API_BASE_URL = LOGIN_API_BASE_URL;

