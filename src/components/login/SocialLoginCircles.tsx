import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CIRCLE_SIZE = 56;
const ICON_SIZE = 26;

const COLORS = {
  border: '#EBEBEB',
  kakao: '#FEE500',
  apple: '#000000',
};

type SocialLoginCirclesProps = {
  onGooglePress: () => void;
  onKakaoPress: () => void;
  onApplePress: () => void;
  googleDisabled?: boolean;
  kakaoDisabled?: boolean;
};

type CircleButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  backgroundColor: string;
  borderColor?: string;
  accessibilityLabel: string;
  children: React.ReactNode;
};

function CircleButton({
  onPress,
  disabled,
  backgroundColor,
  borderColor,
  accessibilityLabel,
  children,
}: CircleButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.circle,
        {
          backgroundColor,
          borderColor: borderColor ?? 'transparent',
          borderWidth: borderColor ? 1 : 0,
        },
        disabled && styles.circleDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      {children}
    </TouchableOpacity>
  );
}

function LogoIcon({ source }: { source: ImageSourcePropType }) {
  return <Image source={source} style={styles.logoIcon} resizeMode="contain" />;
}

export function SocialLoginCircles({
  onGooglePress,
  onKakaoPress,
  onApplePress,
  googleDisabled,
  kakaoDisabled,
}: SocialLoginCirclesProps) {
  return (
    <View style={styles.row}>
      <CircleButton
        onPress={onKakaoPress}
        disabled={kakaoDisabled}
        backgroundColor={COLORS.kakao}
        accessibilityLabel="카카오로 로그인">
        <LogoIcon source={require('../../../assets/images/login/kakao_app_logo.webp')} />
      </CircleButton>

      <CircleButton
        onPress={onGooglePress}
        disabled={googleDisabled}
        backgroundColor="#FFFFFF"
        borderColor={COLORS.border}
        accessibilityLabel="Google로 로그인">
        <LogoIcon source={require('../../../assets/images/login/google_app_logo.webp')} />
      </CircleButton>

      <CircleButton
        onPress={onApplePress}
        backgroundColor={COLORS.apple}
        accessibilityLabel="Apple로 로그인">
        <Ionicons
          name="logo-apple"
          size={Platform.OS === 'ios' ? 28 : 26}
          color="#FFFFFF"
        />
      </CircleButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 4,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDisabled: {
    opacity: 0.5,
  },
  logoIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
