import { Platform } from 'react-native';
import { getKeyHashAndroid, initializeKakaoSDK } from '@react-native-kakao/core';

import {
  KAKAO_JAVASCRIPT_KEY,
  KAKAO_NATIVE_APP_KEY,
  KAKAO_REST_API_KEY,
} from '@/src/constants/auth';

let initPromise: Promise<void> | null = null;
let kakaoSdkInitialized = false;

export function isKakaoSdkInitialized(): boolean {
  return kakaoSdkInitialized;
}

export function ensureKakaoSdkInitialized(): Promise<void> {
  if (!KAKAO_NATIVE_APP_KEY.trim()) {
    return Promise.reject(
      new Error(
        '카카오 Native App Key가 없습니다. .env에 EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY를 설정한 뒤 네이티브 앱을 다시 빌드해 주세요.',
      ),
    );
  }

  if (!initPromise) {
    initPromise = initializeKakaoSDK(
      KAKAO_NATIVE_APP_KEY,
      Platform.OS === 'web'
        ? {
            web: {
              javascriptKey: KAKAO_JAVASCRIPT_KEY,
              restApiKey: KAKAO_REST_API_KEY,
            },
          }
        : undefined,
    )
      .then(() => {
        kakaoSdkInitialized = true;
      })
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }

  return initPromise;
}

export async function logKakaoAndroidKeyHash(): Promise<void> {
  if (!__DEV__ || Platform.OS !== 'android') return;
  try {
    const hash = await getKeyHashAndroid();
    if (hash) {
      console.log('[KAKAO] Android key hash (카카오 개발자 콘솔에 등록):', hash);
    }
  } catch {
    // optional debug helper
  }
}
