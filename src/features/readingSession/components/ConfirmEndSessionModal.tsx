import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_FONTS } from '@/src/theme/fonts';

const COLORS = {
  TEXT: '#222222',
  SUBTITLE: '#666666',
  CANCEL_BG: '#E8E8E8',
  END_BG: '#2C8C55',
  WHITE: '#FFFFFF',
};

const FONTS = APP_FONTS;

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmEndSessionModal({ visible, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>독서 종료하기</Text>
          <Text style={styles.body}>
            정말 독서 세션을 종료하시겠습니까?{'\n'}
            종료 후 읽은 쪽수를 기록하게 됩니다.
          </Text>
          <View style={styles.btnRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onCancel}
              accessibilityRole="button">
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              style={styles.endBtn}
              onPress={onConfirm}
              accessibilityRole="button">
              <Text style={styles.endText}>종료</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 28,
  },
  title: {
    fontSize: 18,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    marginBottom: 14,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDDDDD',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.CANCEL_BG,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
  },
  endBtn: {
    flex: 1,
    backgroundColor: COLORS.END_BG,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomRightRadius: 20,
  },
  endText: {
    fontSize: 16,
    color: COLORS.WHITE,
    fontFamily: FONTS.BOLD,
  },
});
