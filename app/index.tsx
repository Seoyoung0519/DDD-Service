// app/index.tsx

import React, { useCallback } from 'react';

import {
  ActivityIndicator,

  Alert,

  Image,

  Platform,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  GoogleLoginResult,
  useGoogleLogin,
} from '@/src/features/auth/useGoogleLogin';

// 로고 이미지
const APP_LOGO = require('../assets/images/login/android_app_logo.png');
const GOOGLE_LOGO = require('../assets/images/login/google_app_logo.webp');
const KAKAO_LOGO = require('../assets/images/login/kakao_app_logo.webp');

import { useDeviceType } from '@/hooks/use-device-type';

export default function LoginScreen() {
  
  const { isTablet } = useDeviceType();

  const router = useRouter();

  const onLoginSuccess = useCallback(

    (result: GoogleLoginResult) => {

      const { user, idToken, platform } = result;

      console.log(`[LOGIN] platform: ${platform}`);

      console.log('[LOGIN] user:', user);

      console.log('[LOGIN] idToken:', idToken);

      // TODO: 여기에서 Supabase / 백엔드로 idToken + user 전송

      // fetch('https://백엔드/api/auth/google', { ... })

      // 온보딩 화면으로 이동
      router.replace('/onboarding');

    },

    [router],

  );

  const { isLoading, login, request } = useGoogleLogin(onLoginSuccess);

  const handleKakao = () => {

    Alert.alert('준비 중', '카카오 로그인은 나중에 연동할 예정입니다.');

  };

  return (

    <View style={styles.root}>

      {/* 상단 로고 영역 */}

      <View style={styles.logoContainer}>

        <Image source={APP_LOGO} style={styles.logoImage} resizeMode="contain" />

      </View>

      {/* 하단 카드 영역 */}

      <View style={styles.card}>

        {/* 이메일 / 폰 입력 */}

        <TextInput

          placeholder="Email or Phone number"

          placeholderTextColor="#A0A0A0"

          style={[styles.input, isTablet && styles.inputTablet]}

          keyboardType="email-address"

          autoCapitalize="none"

        />

        {/* CONTINUE 버튼 (아직 동작은 없음) */}

        <TouchableOpacity

          style={[styles.continueButton, isTablet && styles.continueButtonTablet]}

          activeOpacity={0.8}

          onPress={() => Alert.alert('알림', '이메일/전화 로그인은 추후 구현 예정입니다.')}

        >

          <Text style={[styles.continueText, isTablet && styles.continueTextTablet]}>CONTINUE</Text>

        </TouchableOpacity>

        {/* 구분선 텍스트 */}

        <View style={styles.orContainer}>

          <View style={styles.orLine} />

          <Text style={styles.orText}>or use</Text>

          <View style={styles.orLine} />

        </View>

        {/* Google 로그인 버튼 */}

        <TouchableOpacity

          style={[styles.googleButton, isTablet && styles.googleButtonTablet]}

          activeOpacity={0.8}

          onPress={login}

          disabled={isLoading || (Platform.OS === 'web' && !request)}

        >

          <View style={styles.socialContent}>

            <Image source={GOOGLE_LOGO} style={styles.socialIcon} resizeMode="contain" />

            <View style={styles.textContainer}>

              <Text style={styles.googleText}>Sign in with Google</Text>

            </View>

          </View>

        </TouchableOpacity>

        {/* Kakao 로그인 버튼 */}

        <TouchableOpacity

          style={[styles.kakaoButton, isTablet && styles.kakaoButtonTablet]}

          activeOpacity={0.8}

          onPress={handleKakao}

        >

          <View style={styles.socialContent}>

            <Image source={KAKAO_LOGO} style={styles.kakaoIcon} resizeMode="contain" />

            <View style={styles.textContainer}>

              <Text style={styles.kakaoText}>Sign in with Kakao</Text>

            </View>

          </View>

        </TouchableOpacity>

        {/* 로딩 표시 */}

        {isLoading && (

          <View style={styles.loadingOverlay}>

            <ActivityIndicator size="large" color="#2D4F2F" />

          </View>

        )}

      </View>

    </View>

  );

}

const styles = StyleSheet.create({

  root: {

    flex: 1,

    backgroundColor: '#F0EEEB', // 배경색

    alignItems: 'center',

    justifyContent: 'flex-start',

  },

  logoContainer: {

    flex: 1.2,

    alignItems: 'center',

    justifyContent: 'center',

    width: '100%',

    paddingTop: 50,

  },

  logoImage: {

    width: '90%',

    height: '90%',

  },

  card: {

    flex: 1,

    width: '100%',

    paddingHorizontal: 24,

    paddingBottom: 32,

    paddingTop: 45,

    backgroundColor: '#F0EEEB', // 배경색

  },

  input: {

    height: 48,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: '#D2D2D2',

    paddingHorizontal: 16,

    fontSize: 14,

    backgroundColor: '#FFFFFF',

  },

  continueButton: {

    marginTop: 13,

    height: 45,

    borderRadius: 26,

    backgroundColor: '#264D2C', // 짙은 초록

    alignItems: 'center',

    justifyContent: 'center',

  },

  continueText: {

    color: '#FFFFFF',

    fontSize: 15,

    fontWeight: '600',

    letterSpacing: 0.5,

  },

  orContainer: {

    marginTop: 24,

    marginBottom: 16,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

  },

  orLine: {

    flex: 1,

    height: 1,

    backgroundColor: '#D0D0D0',

  },

  orText: {

    marginHorizontal: 8,

    fontSize: 12,

    color: '#999999',

  },

  googleButton: {

    height: 45,

    borderRadius: 25,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E0E0E0',

    justifyContent: 'center',

    marginBottom: 10,

  },

  kakaoButton: {

    height: 45,

    borderRadius: 25,

    backgroundColor: '#FEE500', // 카카오 노랑

    justifyContent: 'center',

  },

  socialContent: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    width: '100%',

    position: 'relative',

  },

  socialIcon: {

    width: 24,

    height: 24,

    position: 'absolute',

    left: 18,

  },

  kakaoIcon: {

    width: 33,

    height: 32,

    position: 'absolute',

    left: 18,

  },

  textContainer: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  googleText: {

    fontSize: 15,

    fontWeight: '500',

    textAlign: 'center',

  },

  kakaoText: {

    fontSize: 15,

    fontWeight: '500',

    textAlign: 'center',

  },

  loadingOverlay: {

    position: 'absolute',

    top: '35%',

    alignSelf: 'center',

  },

  // 태블릿용 스타일 (안드로이드만) - 모바일과 유사하게 유지

  inputTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

  continueButtonTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

  continueTextTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

  googleButtonTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

  kakaoButtonTablet: {

    // 태블릿도 모바일과 동일한 스타일 유지

  },

});

