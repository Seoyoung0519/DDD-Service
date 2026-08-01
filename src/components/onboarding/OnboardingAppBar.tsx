import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

import { markOnboardingSkipped } from '@/src/services/onboarding/onboardingSkip';
import { initializePushNotifications } from '@/src/services/push/pushNotificationService';

const BUS_ICON = require('../../../assets/images/onboarding/daedokdan-bus.png');

type OnboardingAppBarProps = {
  /** welcome(첫 화면) vs step(2~8단계) */
  variant?: 'welcome' | 'step';
  /** 프로필 수정 모드에서는 건너뛰기 숨김 */
  hideSkip?: boolean;
  style?: ViewStyle;
};

export function OnboardingAppBar({ variant = 'step', hideSkip = false, style }: OnboardingAppBarProps) {
  const router = useRouter();

  const handleSkip = useCallback(async () => {
    await markOnboardingSkipped();
    void initializePushNotifications();
    router.replace('/DaedokPick');
  }, [router]);

  return (
    <View style={[styles.appBar, variant === 'welcome' && styles.appBarWelcome, style]}>
      <View style={styles.appBarLeft}>
        <Image source={BUS_ICON} style={styles.busIcon} resizeMode="contain" />
        <Text style={styles.appTitle}>대독단</Text>
      </View>
      <TouchableOpacity
        style={[styles.skipButton, hideSkip && styles.skipHidden]}
        onPress={() => void handleSkip()}
        disabled={hideSkip}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="온보딩 건너뛰기">
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>
    </View>
  );
}

const FONTS = {
  BOLD: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'sans-serif',
  }),
  MEDIUM: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'sans-serif',
  }),
};

const styles = StyleSheet.create({
  appBar: {
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarWelcome: {
    paddingTop: 50,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busIcon: {
    width: 35,
    height: 35,
    marginRight: 7,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    fontFamily: FONTS.BOLD,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipHidden: {
    opacity: 0,
  },
  skipText: {
    fontSize: 14,
    color: '#777777',
    fontFamily: FONTS.MEDIUM,
  },
});
