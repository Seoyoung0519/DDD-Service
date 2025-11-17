// src/features/auth/useGoogleLogin.ts

import { useCallback, useEffect, useRef, useState } from 'react';

import { Alert, Platform } from 'react-native';

import * as AuthSession from 'expo-auth-session';

import * as GoogleAuthSession from 'expo-auth-session/providers/google';

import * as WebBrowser from 'expo-web-browser';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { GOOGLE_WEB_CLIENT_ID } from '@/src/constants/auth';

import { loginWithGoogleIdToken } from '@/src/api/auth';

WebBrowser.maybeCompleteAuthSession();

export type GoogleLoginUser = {

  id: string;

  email: string;

  name?: string | null;

  givenName?: string | null;

  familyName?: string | null;

  photo?: string | null;

};

export type GoogleLoginResult = {

  platform: 'web' | 'android' | 'ios';

  idToken: string;

  user: GoogleLoginUser;

};

export function useGoogleLogin(onSuccess?: (result: GoogleLoginResult) => void) {

  const [isLoading, setIsLoading] = useState(false);

  const signingRef = useRef(false);

  // 백엔드 API 호출 및 로그인 성공 처리
  const handleLoginSuccess = useCallback(
    async (result: GoogleLoginResult) => {
      // 백엔드 API URL이 설정되어 있으면 호출, 없으면 스킵 (테스트용)
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
      
      if (apiBaseUrl) {
        try {
          // 1) 백엔드로 idToken 전달
          console.log('[AUTH] 백엔드 API 호출 시도:', {
            url: `${apiBaseUrl}/auth/google`,
            idToken: result.idToken.substring(0, 20) + '...',
            platform: result.platform,
          });
          
          const authResponse = await loginWithGoogleIdToken(
            result.idToken,
            result.platform,
          );

          console.log('[AUTH] ✅ backend auth success:', authResponse);

          // TODO: 여기서 authResponse.accessToken / authResponse.user를
          // 전역 상태나 AsyncStorage에 저장하면 됨.
          // 예: await AsyncStorage.setItem('accessToken', authResponse.accessToken);
        } catch (error: any) {
          console.error('[AUTH] ❌ backend auth error:', error);
          // 임시 테스트: 에러가 나도 Alert 없이 콘솔만 찍고 계속 진행
          console.log('[AUTH] 백엔드 API 호출 실패했지만 로그인은 계속 진행합니다.');
          // 실제 배포 시에는 아래 주석을 해제하세요:
          // Alert.alert(
          //   '로그인 실패',
          //   error?.message || '서버 인증 중 오류가 발생했습니다.',
          // );
          // throw error;
        }
      } else {
        // 백엔드 URL이 없으면 테스트 모드
        console.log('[AUTH] 🧪 테스트 모드: 백엔드 API 호출 스킵');
        console.log('[AUTH] 전송할 데이터:', {
          idToken: result.idToken.substring(0, 20) + '...',
          platform: result.platform,
          user: result.user,
        });
      }

      // 백엔드 API 성공/실패와 관계없이 onSuccess 콜백 호출 (테스트용)
      onSuccess?.(result);
    },
    [onSuccess],
  );

  // 웹용 expo-auth-session

  const [request, response, promptAsync] =

    GoogleAuthSession.useIdTokenAuthRequest({

      clientId: GOOGLE_WEB_CLIENT_ID,

      scopes: ['openid', 'profile', 'email'],

      redirectUri: AuthSession.makeRedirectUri({ useProxy: true } as any),

    });

  // 안드로이드용 google-signin 설정

  useEffect(() => {

    if (Platform.OS === 'android') {

      GoogleSignin.configure({

        webClientId: GOOGLE_WEB_CLIENT_ID,

      });

    }

  }, []);

  // 웹에서 Google 로그인 결과 처리

  useEffect(() => {

    if (Platform.OS !== 'web') return;

    if (!response) return;

    const done = () => {

      setIsLoading(false);

      signingRef.current = false;

    };

    const handleWebResponse = async () => {

      console.log('Web Google response:', JSON.stringify(response, null, 2));

      if (response.type === 'success') {

        const idToken = response.params?.id_token;

        const accessToken = response.params?.access_token;

        try {

          let user: GoogleLoginUser | null = null;

          if (accessToken) {

            // access_token 있는 경우: userinfo API 호출

            const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {

              headers: { Authorization: `Bearer ${accessToken}` },

            });

            if (!res.ok) throw new Error('Failed to fetch user info');

            const info = await res.json();

            user = {

              id: info.id,

              email: info.email,

              name: info.name,

              givenName: info.given_name,

              familyName: info.family_name,

              photo: info.picture,

            };

          } else if (idToken) {

            // access_token 없는 경우: idToken 디코딩해서 사용자 정보 추출

            const parts = idToken.split('.');

            if (parts.length === 3) {

              const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');

              const base64 = base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4);

              // 웹 환경: atob 사용

              // @ts-ignore

              const payload = JSON.parse(atob(base64));

              user = {

                id: payload.sub,

                email: payload.email,

                name: payload.name,

                givenName: payload.given_name,

                familyName: payload.family_name,

                photo: payload.picture,

              };

            }

          }

          if (!idToken || !user) {

            throw new Error('토큰 또는 사용자 정보가 없습니다.');

          }

          console.log(

            '[WEB] userInfo:',

            JSON.stringify({ type: 'success', data: { idToken, user } }, null, 2),

          );

          console.log('[WEB] idToken:', idToken);

          const result: GoogleLoginResult = { platform: 'web', idToken, user };
          
          try {
            await handleLoginSuccess(result);
          } catch (e) {
            // handleLoginSuccess에서 이미 Alert를 표시했으므로 여기서는 done()만 호출
          }

          done();

        } catch (e: any) {

          console.error('[WEB] Failed to fetch user info:', e);

          Alert.alert('로그인 실패 (웹)', '사용자 정보를 가져오는 중 오류가 발생했습니다.');

          done();

        }

      } else if (response.type === 'error') {

        console.error('[WEB] Google Login Error:', response.error);

        Alert.alert('로그인 실패 (웹)', response.error?.message ?? '알 수 없는 오류');

        done();

      } else if (response.type === 'cancel') {

        console.log('[WEB] Google Login Cancelled');

        done();

      }

    };

    handleWebResponse();

  }, [response, onSuccess]);

  // 버튼에서 호출할 공용 로그인 함수

  const login = async () => {

    if (signingRef.current) return; // double tap 방지

    signingRef.current = true;

    setIsLoading(true);

    try {

      if (Platform.OS === 'web') {

        // 웹: expo-auth-session으로 브라우저 열기

        await promptAsync();

        return;

      }

      if (Platform.OS === 'android') {

        // 안드로이드: google-signin

        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // 기존 로그인 세션이 있으면 먼저 로그아웃 (테스트용 - 프로덕션에서는 제거하거나 선택적으로 사용)
        try {
          const currentUser = await GoogleSignin.getCurrentUser();
          if (currentUser) {
            console.log('[ANDROID] 기존 세션 발견, 로그아웃 후 재로그인');
            await GoogleSignin.signOut();
          }
        } catch (e) {
          // 로그아웃 실패는 무시하고 계속 진행
          console.log('[ANDROID] 로그아웃 체크 실패:', e);
        }

        const signInResult: any = await GoogleSignin.signIn();

        const idToken: string | undefined =

          signInResult?.data?.idToken ?? signInResult?.idToken;

        const rawUser = signInResult?.data?.user ?? signInResult?.user;

        console.log('[ANDROID] userInfo:', JSON.stringify(signInResult, null, 2));

        console.log('[ANDROID] idToken:', idToken);

        if (!idToken || !rawUser) throw new Error('idToken 또는 사용자 정보가 없습니다.');

        const user: GoogleLoginUser = {

          id: rawUser.id,

          email: rawUser.email,

          name: rawUser.name,

          givenName: rawUser.givenName,

          familyName: rawUser.familyName,

          photo: rawUser.photo,

        };

        const result: GoogleLoginResult = { platform: 'android', idToken, user };
        
        try {
          await handleLoginSuccess(result);
        } catch (e) {
          // handleLoginSuccess에서 이미 Alert를 표시했으므로 여기서는 로딩 상태만 초기화
          setIsLoading(false);
          signingRef.current = false;
          return;
        }

        setIsLoading(false);

        signingRef.current = false;

        return;

      }

      Alert.alert('알림', '지원하지 않는 플랫폼입니다.');

      setIsLoading(false);

      signingRef.current = false;

    } catch (error: any) {

      if (error?.code === statusCodes?.IN_PROGRESS) {

        console.log('[ANDROID] Sign-in in progress; ignoring duplicate tap');

      } else {

        console.error('Login error:', error);

        Alert.alert('로그인 실패', error?.message ?? '로그인 중 오류가 발생했습니다.');

      }

      setIsLoading(false);

      signingRef.current = false;

    }

  };

  return { isLoading, login, request };

}

