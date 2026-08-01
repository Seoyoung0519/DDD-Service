// app/login.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginHeaderPattern } from '@/src/components/login/LoginWaveDivider';
import { SocialLoginCircles } from '@/src/components/login/SocialLoginCircles';
import {
  GoogleLoginResult,
  useGoogleLogin,
} from '@/src/features/auth/useGoogleLogin';
import { useKakaoLogin } from '@/src/features/auth/useKakaoLogin';
import {
  fetchCurrentUser,
  sendEmailVerificationCode,
  verifyEmailCode,
} from '@/src/services/auth/authService';
import {
  fetchOnboardingState,
} from '@/src/services/onboarding/onboardingService';
import { isOnboardingSkipped } from '@/src/services/onboarding/onboardingSkip';
import { resolveAgreementsGateRoute } from '@/src/services/settings/agreementGate';
import { initializePushNotifications } from '@/src/services/push/pushNotificationService';
import { syncExtendedApiSession } from '@/src/utils/extendedApiAuth';

const APP_LOGO = require('../assets/images/login/login_logo.png');

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HEADER_HEIGHT = Math.min(SCREEN_H * 0.38, 320);
const LOGIN_CORNER_RADIUS = 40;
const EMAIL_RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLORS = {
  header: '#E8F3ED',
  body: '#FFFFFF',
  primary: '#1A1A1A',
  text: '#1A1A1A',
  muted: '#8A8A8A',
  inputBg: '#F4F4F4',
  inputBorder: '#EBEBEB',
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const emailRequestInFlightRef = useRef(false);

  const onLoginSuccess = useCallback(async () => {
    try {
      const user = await fetchCurrentUser();
      if (user.role === 'admin') {
        router.replace('/AdminDashboardScreen');
        return;
      }

      if (await isOnboardingSkipped()) {
        void initializePushNotifications();
        router.replace('/DaedokPick');
        return;
      }

      const onboardingState = await fetchOnboardingState();

      if (onboardingState && onboardingState.isOnboarded) {
        void initializePushNotifications();
        router.replace('/Drawer_1');
        return;
      }

      // 신규·온보딩 미완료: 약관 동의 → 온보딩 입력
      const agreementsRoute = await resolveAgreementsGateRoute('onboarding');
      if (agreementsRoute) {
        router.replace(agreementsRoute);
        return;
      }
      router.replace('/onboarding');
    } catch {
      const agreementsRoute = await resolveAgreementsGateRoute('onboarding');
      if (agreementsRoute) {
        router.replace(agreementsRoute);
        return;
      }
      router.replace('/onboarding');
    }
  }, [router]);

  const { isLoading: isGoogleLoading, login: googleLogin, request } = useGoogleLogin(
    async (_result: GoogleLoginResult) => {
      await onLoginSuccess();
    },
  );
  const { isLoading: isKakaoLoading, login: kakaoLogin } = useKakaoLogin(onLoginSuccess);

  const isLoading = isGoogleLoading || isKakaoLoading || isEmailLoading;

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const normalizedEmail = email.trim().toLowerCase();

  const handleSendCode = async (isResend = false) => {
    if (emailRequestInFlightRef.current) return;
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      Alert.alert('이메일 확인', '올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    if (isResend && resendSeconds > 0) return;

    emailRequestInFlightRef.current = true;
    setIsEmailLoading(true);
    try {
      await sendEmailVerificationCode(normalizedEmail);
      setIsCodeSent(true);
      setVerificationCode('');
      setResendSeconds(EMAIL_RESEND_COOLDOWN_SECONDS);
      Alert.alert('인증 코드 발송 완료', `${normalizedEmail}으로 6자리 인증 코드를 보냈습니다.`);
    } catch (error) {
      Alert.alert(
        '인증 코드 발송 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      emailRequestInFlightRef.current = false;
      setIsEmailLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (emailRequestInFlightRef.current) return;
    if (!/^\d{6}$/.test(verificationCode)) {
      Alert.alert('인증 코드 확인', '이메일로 받은 6자리 숫자를 입력해 주세요.');
      return;
    }
    emailRequestInFlightRef.current = true;
    setIsEmailLoading(true);
    try {
      const authResponse = await verifyEmailCode({
        email: normalizedEmail,
        code: verificationCode,
        name: name.trim() || undefined,
      });
      const platform =
        Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      await syncExtendedApiSession({ loginJwt: authResponse.accessToken, platform });
      await onLoginSuccess();
    } catch (error) {
      Alert.alert(
        '이메일 로그인 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      emailRequestInFlightRef.current = false;
      setIsEmailLoading(false);
    }
  };

  const handleEmailContinue = () => {
    if (isCodeSent) void handleEmailLogin();
    else void handleSendCode();
  };

  const handleKakao = () => {
    void kakaoLogin();
  };

  const handleApple = () => {
    Alert.alert('준비 중', 'Apple 로그인은 나중에 연동할 예정입니다.');
  };

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            height: headerTotalHeight,
          },
        ]}>
        <LoginHeaderPattern
          width={SCREEN_W}
          height={HEADER_HEIGHT}
          tintColor="#3D5C4A"
        />
        <View style={styles.logoWrap}>
          <Image source={APP_LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.formScroll,
            {
              paddingTop: 36,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.screenTitle}>Login</Text>
          <Text style={styles.screenSub}>이메일 또는 소셜 계정으로 시작해 보세요</Text>

          <Text style={styles.fieldLabel}>이메일</Text>
          <TextInput
            placeholder="example@email.com"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isCodeSent && !isLoading}
            value={email}
            onChangeText={setEmail}
            returnKeyType={isCodeSent ? 'next' : 'send'}
            onSubmitEditing={isCodeSent ? undefined : handleEmailContinue}
          />

          {isCodeSent ? (
            <>
              <View style={styles.codeLabelRow}>
                <Text style={styles.fieldLabel}>인증 코드</Text>
                <TouchableOpacity
                  disabled={isLoading || resendSeconds > 0}
                  onPress={() => void handleSendCode(true)}
                  hitSlop={8}>
                  <Text
                    style={[
                      styles.resendText,
                      (isLoading || resendSeconds > 0) && styles.resendTextDisabled,
                    ]}>
                    {resendSeconds > 0 ? `재발송 ${resendSeconds}초` : '인증 코드 재발송'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder="6자리 숫자"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                editable={!isLoading}
                value={verificationCode}
                onChangeText={(value) =>
                  setVerificationCode(value.replace(/\D/g, '').slice(0, 6))
                }
              />

              <Text style={[styles.fieldLabel, styles.nameLabel]}>
                이름 <Text style={styles.optionalText}>(처음 가입하는 경우)</Text>
              </Text>
              <TextInput
                placeholder="이름을 입력해 주세요"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                editable={!isLoading}
                value={name}
                onChangeText={setName}
                returnKeyType="done"
                onSubmitEditing={handleEmailContinue}
              />
            </>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            activeOpacity={0.88}
            disabled={isLoading}
            onPress={handleEmailContinue}>
            <Text style={styles.primaryButtonText}>
              {isCodeSent ? '이메일로 로그인' : '인증 코드 받기'}
            </Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>다른 방법으로 로그인</Text>
            <View style={styles.orLine} />
          </View>

          <SocialLoginCircles
            onGooglePress={googleLogin}
            onKakaoPress={handleKakao}
            onApplePress={handleApple}
            googleDisabled={isLoading || (Platform.OS === 'web' && !request)}
            kakaoDisabled={isLoading}
          />
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.header,
  },
  header: {
    backgroundColor: COLORS.header,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoImage: {
    width: 200,
    height: 220,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.body,
    borderTopRightRadius: LOGIN_CORNER_RADIUS,
    overflow: 'hidden',
  },
  formScroll: {
    paddingHorizontal: 28,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  screenSub: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 28,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 8,
    marginLeft: 4,
  },
  codeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C8C55',
    marginBottom: 8,
  },
  resendTextDisabled: { color: '#AAAAAA' },
  nameLabel: { marginTop: 16 },
  optionalText: { fontSize: 11, fontWeight: '400', color: '#AAAAAA' },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 18,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  primaryButton: {
    marginTop: 22,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonDisabled: { opacity: 0.55 },
  orRow: {
    marginTop: 32,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  orText: {
    fontSize: 12,
    color: COLORS.muted,
    flexShrink: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
});
