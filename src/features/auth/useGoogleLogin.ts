// src/features/auth/useGoogleLogin.ts

import { useCallback, useEffect, useRef, useState } from 'react';

import { Alert, Platform } from 'react-native';

import * as AuthSession from 'expo-auth-session';

import * as GoogleAuthSession from 'expo-auth-session/providers/google';

import * as WebBrowser from 'expo-web-browser';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { GOOGLE_WEB_CLIENT_ID } from '@/src/constants/auth';

import { loginWithGoogle } from '@/src/services/auth/authService';

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
      try {
        // 백엔드로 idToken 전달
        const authResponse = await loginWithGoogle({
          idToken: result.idToken,
          platform: result.platform,
        });

        console.log('[AUTH] ✅ Login success:', authResponse.user.email);

        // onSuccess 콜백 호출 (온보딩 화면으로 네비게이션 등)
        onSuccess?.(result);
      } catch (error: any) {
        console.error('[AUTH] ❌ Login error:', error);
        Alert.alert(
          '로그인 실패',
          error?.message || '서버 인증 중 오류가 발생했습니다.',
        );
        throw error;
      }
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
        // offlineAccess: true로 설정하면 serverAuthCode를 받을 수 있음
        // 백엔드가 Google API에 접근해야 할 때만 필요
        // 일반적인 로그인 인증만 필요하면 false (기본값)로 유지
        offlineAccess: true, // 필요시 true로 변경
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

          console.log('[WEB] Login successful');

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

        // 기존 세션이 있어도 토큰이 만료되었을 수 있으므로 항상 signIn()을 호출하여 새로운 토큰을 받습니다
        // signIn()은 이미 로그인되어 있으면 사용자에게 다시 로그인을 요청하지 않고 새로운 토큰을 반환합니다

        const signInResult: any = await GoogleSignin.signIn();

        // idToken 추출 - 여러 가능한 경로 확인
        let idToken: string | undefined =
          signInResult?.data?.idToken ??
          signInResult?.idToken ??
          signInResult?.data?.id_token ??
          signInResult?.id_token;

        // idToken이 없으면 getTokens()로 시도
        if (!idToken) {
          try {
            const tokens = await GoogleSignin.getTokens();
            idToken = tokens?.idToken;
          } catch (e) {
            // getTokens 실패는 무시
          }
        }

        const rawUser = signInResult?.data?.user ?? signInResult?.user;

        console.log('[ANDROID] Login successful');

        if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
          console.error('[ANDROID] Invalid idToken:', {
            idToken,
            type: typeof idToken,
            signInResultKeys: Object.keys(signInResult || {}),
            dataKeys: signInResult?.data ? Object.keys(signInResult.data) : [],
          });
          throw new Error('idToken을 가져올 수 없습니다.');
        }

        if (!rawUser) {
          throw new Error('사용자 정보를 가져올 수 없습니다.');
        }

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

