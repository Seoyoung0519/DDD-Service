import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const COLORS = {
  TEXT: '#222222',
  SUBTITLE: '#666666',
  CANCEL_BG: '#E8E8E8',
  CONFIRM_BG: '#2C8C55',
  WHITE: '#FFFFFF',
};

const FONTS = {
  BOLD: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  REGULAR: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

type Props = {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel: string;
  confirmLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AppConfirmModal({
  visible,
  title,
  message,
  cancelLabel = '취소',
  confirmLabel,
  confirmLoading = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
          <View style={styles.btnRow}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={confirmLoading}
              accessibilityRole="button">
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, confirmLoading && styles.btnDisabled]}
              onPress={onConfirm}
              disabled={confirmLoading}
              accessibilityRole="button">
              {confirmLoading ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  title: {
    fontSize: 18,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.CANCEL_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.CONFIRM_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 15,
    color: COLORS.WHITE,
    fontFamily: FONTS.BOLD,
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
