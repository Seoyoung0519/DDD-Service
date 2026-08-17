import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/AppText';

const SPLASH_LOGO = require('../../../assets/images/splash/daedokdan-bus-logo.png');

const COLORS = {
  background: '#E8F3ED',
  tagline: '#3D5C4A',
};

type AppLaunchSplashProps = {
  tagline?: string;
};

export function AppLaunchSplash({ tagline = '출퇴근을 독서와 함께' }: AppLaunchSplashProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Image source={SPLASH_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="대독단" />
        <AppText variant="title" weight="bold" style={styles.tagline}>
          {tagline}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 28,
    // 아이콘 하단 바퀴가 잘리지 않도록 여유
    overflow: 'visible',
  },
  tagline: {
    fontSize: 18,
    color: COLORS.tagline,
    letterSpacing: -0.2,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
