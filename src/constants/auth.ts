// src/constants/auth.ts

import Constants from 'expo-constants';

function readEnvOrExtra(envName: string, extraKey: string): string {
  const fromEnv = String(process.env[envName] ?? '').trim();
  if (fromEnv) return fromEnv;

  const fromExtra = Constants.expoConfig?.extra?.[extraKey];
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim();

  return '';
}

export const GOOGLE_WEB_CLIENT_ID =
  '812023573352-hb556lik81tjpmr9jsaoqigbnhlt50kp.apps.googleusercontent.com';

export const GOOGLE_ANDROID_CLIENT_ID =
  '812023573352-8t9uudrc8c1p29iht9a0t432l06cc15d.apps.googleusercontent.com';

/** 카카오 개발자 콘솔 — 앱 키 (네이티브 앱 키) */
export const KAKAO_NATIVE_APP_KEY = readEnvOrExtra(
  'EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY',
  'kakaoNativeAppKey',
);

/** 카카오 웹 로그인용 JavaScript 키 */
export const KAKAO_JAVASCRIPT_KEY = readEnvOrExtra(
  'EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY',
  'kakaoJavascriptKey',
);

/** 카카오 REST API 키 (웹 OAuth) */
export const KAKAO_REST_API_KEY = readEnvOrExtra(
  'EXPO_PUBLIC_KAKAO_REST_API_KEY',
  'kakaoRestApiKey',
);