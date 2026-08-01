import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { KAKAO_REST_API_KEY } from '@/src/constants/auth';
import {
  KAKAO_SCOPES,
  logKakaoAndroidKeyHash,
  performKakaoNativeLogin,
} from '@/src/features/auth/kakaoNativeLogin';
import { loginWithKakao, type LoginPlatform } from '@/src/services/auth/authService';
import { syncExtendedApiSession } from '@/src/utils/extendedApiAuth';

WebBrowser.maybeCompleteAuthSession();

function currentPlatform(): LoginPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function getKakaoErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const lower = message.toLowerCase();
  if (lower.includes('syntaxerror') || lower.includes('identifier')) {
    return '앱 번들 오류입니다. Metro를 종료한 뒤 `npx expo start --clear`로 다시 시작해 주세요.';
  }
  if (lower.includes('access token not found') || lower.includes('you must login first')) {
    return '카카오 로그인 세션이 만료되었습니다. 다시 시도해 주세요.';
  }
  if (
    lower.includes('scope') ||
    lower.includes('동의') ||
    lower.includes('consent') ||
    lower.includes('agreement')
  ) {
    return '카카오 동의 항목 설정을 확인해 주세요. 개발자 콘솔에서 닉네임·프로필·이메일 동의 항목이 활성화되어 있는지 확인 후 다시 시도해 주세요.';
  }
  return message || '카카오 로그인 중 오류가 발생했습니다.';
}

function isUserCancelled(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const lower = message.toLowerCase();
  return (
    lower.includes('cancel') ||
    lower.includes('canceled') ||
    lower.includes('취소') ||
    lower.includes('user denied')
  );
}

export function useKakaoLogin(onSuccess?: () => void | Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);
  const signingRef = useRef(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'daedokdan',
    path: 'kakao',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: KAKAO_REST_API_KEY,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: [...KAKAO_SCOPES],
      extraParams: { prompt: 'login' },
    },
    {
      authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
      tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
    },
  );

  const completeBackendLogin = useCallback(
    async (kakaoAccessToken: string) => {
      const platform = currentPlatform();
      const authResponse = await loginWithKakao({ accessToken: kakaoAccessToken, platform });
      await syncExtendedApiSession({
        loginJwt: authResponse.accessToken,
        platform,
      });
      await onSuccess?.();
    },
    [onSuccess],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!response || response.type !== 'success') {
      if (response?.type === 'error') {
        Alert.alert('카카오 로그인 실패', response.error?.message ?? '알 수 없는 오류');
        setIsLoading(false);
        signingRef.current = false;
      } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
        setIsLoading(false);
        signingRef.current = false;
      }
      return;
    }

    const code = response.params?.code;
    if (!code) {
      setIsLoading(false);
      signingRef.current = false;
      return;
    }

    const exchange = async () => {
      try {
        const { ensureKakaoSdkInitialized } = await import('@/src/features/auth/kakaoSdk');
        const { issueAccessTokenWithCodeWeb } = await import('@react-native-kakao/user');
        await ensureKakaoSdkInitialized();
        const token = await issueAccessTokenWithCodeWeb({
          code,
          redirectUri,
        });
        if (!token.accessToken) {
          throw new Error('카카오 accessToken을 받지 못했습니다.');
        }
        await completeBackendLogin(token.accessToken);
      } catch (error: unknown) {
        if (!isUserCancelled(error)) {
          console.error('[KAKAO] Web OAuth error:', error);
          Alert.alert('카카오 로그인 실패', getKakaoErrorMessage(error));
        }
      } finally {
        setIsLoading(false);
        signingRef.current = false;
      }
    };

    void exchange();
  }, [response, redirectUri, completeBackendLogin]);

  const login = useCallback(async () => {
    if (signingRef.current) return;
    signingRef.current = true;
    setIsLoading(true);

    try {
      if (Platform.OS === 'web') {
        if (!KAKAO_REST_API_KEY) {
          throw new Error('카카오 REST API 키가 설정되지 않았습니다.');
        }
        if (!request) {
          throw new Error('카카오 로그인 요청을 준비하지 못했습니다.');
        }
        await promptAsync();
        return;
      }

      void logKakaoAndroidKeyHash();

      const token = await performKakaoNativeLogin();
      if (__DEV__) {
        console.log('[KAKAO] 백엔드 로그인 요청');
      }
      await completeBackendLogin(token.accessToken);
      setIsLoading(false);
      signingRef.current = false;
    } catch (error: unknown) {
      if (!isUserCancelled(error)) {
        console.error('[KAKAO] Login error:', error);
        Alert.alert('카카오 로그인 실패', getKakaoErrorMessage(error));
      }
      setIsLoading(false);
      signingRef.current = false;
    }
  }, [completeBackendLogin, promptAsync, request]);

  return { isLoading, login };
}
