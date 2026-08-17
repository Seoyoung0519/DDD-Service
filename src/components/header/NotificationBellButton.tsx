import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  formatNotificationBadgeCount,
  useNotificationBadge,
} from '@/src/hooks/useNotificationBadge';
import { APP_FONTS } from '@/src/theme/fonts';

const BELL_ICON = require('../../../assets/images/drawer/bell.png');

const COLORS = {
  PRIMARY: '#2C8C55',
};

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function NotificationBellButton({ style }: Props) {
  const router = useRouter();
  const unreadNotificationCount = useNotificationBadge();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => router.push('/NotificationsScreen')}
      accessibilityRole="button"
      accessibilityLabel={`알림 ${unreadNotificationCount}개`}>
      <ExpoImage source={BELL_ICON} style={styles.bellIcon} contentFit="contain" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {formatNotificationBadgeCount(unreadNotificationCount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellIcon: {
    width: 22,
    height: 22,
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: -5,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 23,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: APP_FONTS.BOLD,
    color: '#FFFFFF',
  },
});
