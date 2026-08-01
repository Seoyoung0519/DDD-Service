import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SPLASH_LOGO = require('../../../assets/images/splash/splash-logo.png');

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
        <Text style={styles.tagline}>{tagline}</Text>
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
    height: 220,
    marginBottom: 28,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.tagline,
    letterSpacing: -0.2,
  },
});
