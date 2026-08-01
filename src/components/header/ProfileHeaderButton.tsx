import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  iconSize?: number;
};

export function ProfileHeaderButton({
  style,
  iconColor = '#222',
  iconSize = 24,
}: Props) {
  const router = useRouter();

  const onPress = useCallback(() => {
    router.push('/AccountManagementScreen');
  }, [router]);

  return (
    <Pressable
      style={style}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="계정 관리">
      <Ionicons name="person-circle-outline" size={iconSize} color={iconColor} />
    </Pressable>
  );
}
