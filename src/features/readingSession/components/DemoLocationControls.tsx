import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const FONTS = {
  MEDIUM: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  REGULAR: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

type Props = {
  currentStep: number;
  totalSteps: number;
  onAdvance: () => void | Promise<void>;
};

export function DemoLocationControls({ currentStep, totalSteps, onAdvance }: Props) {
  const atEnd = totalSteps > 0 && currentStep >= totalSteps - 1;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        데모 위치 모드 · {currentStep + 1}/{totalSteps} 지점
      </Text>
      <Text style={styles.hint}>
        「다음 지점으로 이동」을 누르면 환승·도착 알림과 진행 바가 갱신됩니다.
      </Text>
      <Pressable
        onPress={() => void onAdvance()}
        disabled={atEnd}
        style={({ pressed }) => [
          styles.btn,
          atEnd && styles.btnDisabled,
          pressed && !atEnd && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="다음 지점으로 이동"
        accessibilityState={{ disabled: atEnd }}>
        <Text style={[styles.btnText, atEnd && styles.btnTextDisabled]}>
          {atEnd ? '도착지에 도달했습니다' : '다음 지점으로 이동'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFF8E6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D98C',
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#6B4E00',
    fontFamily: FONTS.MEDIUM,
  },
  hint: {
    fontSize: 12,
    color: '#8A6D1D',
    fontFamily: FONTS.REGULAR,
    lineHeight: 17,
  },
  btn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#6B4E00',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnDisabled: {
    backgroundColor: '#D8C89A',
  },
  btnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: FONTS.MEDIUM,
  },
  btnTextDisabled: {
    color: '#F5F0E4',
  },
});
