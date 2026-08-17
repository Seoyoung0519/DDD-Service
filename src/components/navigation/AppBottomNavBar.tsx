import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

function withoutFixedHeight(style: StyleProp<ViewStyle>): ViewStyle {
  const flat = StyleSheet.flatten(style);
  if (!flat) return {};
  const next: ViewStyle = { ...flat };
  delete next.height;
  delete next.minHeight;
  delete next.paddingBottom;
  return next;
}

/**
 * 삼성 3버튼·제스처 바와 겹치지 않도록 하단 inset을 반영한 탭 바.
 * 고정 height를 쓰지 않고, 아이콘/라벨을 시스템 바 위에 올린 뒤 아래만 패딩합니다.
 */
export function AppBottomNavBar({ children, style }: Props) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 8);

  return (
    <View style={[styles.bar, withoutFixedHeight(style), { paddingBottom }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    paddingTop: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    overflow: 'visible',
  },
});
