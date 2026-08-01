import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type AppMenuButtonProps = {
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  iconSize?: number;
};

export function AppMenuButton({
  style,
  iconColor = '#222',
  iconSize = 24,
}: AppMenuButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={style}
      onPress={() => router.push('/SettingsScreen')}
      accessibilityRole="button"
      accessibilityLabel="설정">
      <Ionicons name="menu" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}
