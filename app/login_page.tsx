// app/login_page.tsx

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

export default function LoginScreen() {

  const router = useRouter();

  const onLoginSuccess = useCallback(

    (result: GoogleLoginResult) => {

      const { user, idToken, platform } = result;

      console.log(`[LOGIN] platform: ${platform}`);

      console.log('[LOGIN] user:', user);

      console.log('[LOGIN] idToken:', idToken);

      // TODO: 여기에서 Supabase / 백엔드로 idToken + user 전송

      // fetch('https://백엔드/api/auth/google', { ... })

      // 온보딩 화면으로 이동 (onboarding 화면이 준비되면 주석 해제)

      // router.replace('/onboarding');

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

          style={styles.input}

          keyboardType="email-address"

          autoCapitalize="none"

        />

        {/* CONTINUE 버튼 (아직 동작은 없음) */}

        <TouchableOpacity

          style={styles.continueButton}

          activeOpacity={0.8}

          onPress={() => Alert.alert('알림', '이메일/전화 로그인은 추후 구현 예정입니다.')}

        >

          <Text style={styles.continueText}>CONTINUE</Text>

        </TouchableOpacity>

        {/* 구분선 텍스트 */}

        <View style={styles.orContainer}>

          <View style={styles.orLine} />

          <Text style={styles.orText}>or use</Text>

          <View style={styles.orLine} />

        </View>

        {/* Google 로그인 버튼 */}

        <TouchableOpacity

          style={styles.googleButton}

          activeOpacity={0.8}

          onPress={login}

          disabled={isLoading || (Platform.OS === 'web' && !request)}

        >

          <View style={styles.socialContent}>

            <Image source={GOOGLE_LOGO} style={styles.socialIcon} resizeMode="contain" />

            <Text style={styles.googleText}>Sign in with Google</Text>

          </View>

        </TouchableOpacity>

        {/* Kakao 로그인 버튼 */}

        <TouchableOpacity

          style={styles.kakaoButton}

          activeOpacity={0.8}

          onPress={handleKakao}

        >

          <View style={styles.socialContent}>

            <Image source={KAKAO_LOGO} style={styles.socialIcon} resizeMode="contain" />

            <Text style={styles.kakaoText}>Sign in with Kakao</Text>

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

    backgroundColor: '#F5F3EB', // 크림색 배경

    alignItems: 'center',

    justifyContent: 'flex-start',

  },

  logoContainer: {

    flex: 1.2,

    alignItems: 'center',

    justifyContent: 'center',

    width: '100%',

  },

  logoImage: {

    width: '70%',

    height: '70%',

  },

  card: {

    flex: 1,

    width: '100%',

    paddingHorizontal: 24,

    paddingBottom: 32,

    paddingTop: 24,

    backgroundColor: '#F5F3EB',

  },

  input: {

    height: 52,

    borderRadius: 6,

    borderWidth: 1,

    borderColor: '#D2D2D2',

    paddingHorizontal: 16,

    fontSize: 16,

    backgroundColor: '#FFFFFF',

  },

  continueButton: {

    marginTop: 16,

    height: 52,

    borderRadius: 26,

    backgroundColor: '#264D2C', // 짙은 초록

    alignItems: 'center',

    justifyContent: 'center',

  },

  continueText: {

    color: '#FFFFFF',

    fontSize: 16,

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

    height: 50,

    borderRadius: 25,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E0E0E0',

    justifyContent: 'center',

    marginBottom: 10,

  },

  kakaoButton: {

    height: 50,

    borderRadius: 25,

    backgroundColor: '#FEE500', // 카카오 노랑

    justifyContent: 'center',

  },

  socialContent: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

  },

  socialIcon: {

    width: 20,

    height: 20,

    marginRight: 8,

  },

  googleText: {

    fontSize: 15,

    fontWeight: '500',

  },

  kakaoText: {

    fontSize: 15,

    fontWeight: '500',

  },

  loadingOverlay: {

    position: 'absolute',

    top: '35%',

    alignSelf: 'center',

  },

});

