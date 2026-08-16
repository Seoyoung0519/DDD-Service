import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';
import { deleteAccount } from '@/src/api/settings';
import { logoutFromApp } from '@/src/features/auth/logout';
import { clearCachedOnboardingProfile } from '@/src/services/onboarding/onboardingProfileCache';
import {
  clearOnboardingAgreementPending,
  clearOnboardingSkipped,
} from '@/src/services/onboarding/onboardingSkip';
import { cancelAllScheduledDeviceNotifications } from '@/src/services/push/deviceNotificationService';
import { clearNotificationInbox } from '@/src/services/push/notificationInbox';

const CONFIRM_TEXT = '탈퇴';

export default function SettingsDeleteAccountScreen() {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const canDelete = confirmText.trim() === CONFIRM_TEXT && !deleting;

  const executeDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await deleteAccount({
        reason: reason.trim() || undefined,
        confirmText: CONFIRM_TEXT,
      });

      await Promise.allSettled([
        clearCachedOnboardingProfile(),
        clearOnboardingAgreementPending(),
        clearOnboardingSkipped(),
        clearNotificationInbox(),
        cancelAllScheduledDeviceNotifications(),
      ]);
      await logoutFromApp();
      router.replace('/login');
    } catch (error) {
      Alert.alert(
        '계정 탈퇴 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!canDelete) return;
    setConfirmModalVisible(true);
  };

  const closeConfirmModal = () => {
    if (deleting) return;
    setConfirmModalVisible(false);
  };

  const handleConfirmDelete = () => {
    setConfirmModalVisible(false);
    void executeDelete();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} disabled={deleting}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>계정 탈퇴</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>탈퇴 사유 (선택)</Text>
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="불편했던 점을 알려주시면 서비스 개선에 참고할게요."
            placeholderTextColor="#AAAAAA"
            multiline
            maxLength={500}
            textAlignVertical="top"
            editable={!deleting}
          />
          <Text style={styles.counter}>{reason.length}/500</Text>

          <Text style={styles.label}>
            확인을 위해 <Text style={styles.confirmWord}>탈퇴</Text>를 입력해 주세요.
          </Text>
          <TextInput
            style={[
              styles.confirmInput,
              confirmText.length > 0 && !canDelete && styles.confirmInputInvalid,
            ]}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="탈퇴"
            placeholderTextColor="#AAAAAA"
            autoCorrect={false}
            editable={!deleting}
          />

          <Pressable
            style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
            disabled={!canDelete}
            onPress={confirmDelete}>
            {deleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteButtonText}>계정 탈퇴</Text>
            )}
          </Pressable>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      {deleting ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#B33B3B" />
          <Text style={styles.overlayText}>계정을 안전하게 삭제하고 있어요.</Text>
        </View>
      ) : null}

      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeConfirmModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>정말 탈퇴하시겠습니까?</Text>
            <Text style={styles.modalBody}>
              계정 정보와 독서 기록 등의 데이터가 삭제되며 복구가 불가능합니다.
            </Text>
            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={closeConfirmModal}
                accessibilityRole="button">
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.modalDeleteBtn}
                onPress={handleConfirmDelete}
                accessibilityRole="button">
                <Text style={styles.modalDeleteText}>계정 탈퇴</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#222222' },
  headerSpacer: { width: 28 },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '700', color: '#222222', marginTop: 4, marginBottom: 9 },
  confirmWord: { color: '#B33B3B' },
  reasonInput: {
    minHeight: 125,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    fontSize: 14,
    lineHeight: 21,
    color: '#222222',
  },
  counter: { fontSize: 11, color: '#999999', textAlign: 'right', marginTop: 5 },
  confirmInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#222222',
  },
  confirmInputInvalid: { borderColor: '#D96A6A' },
  deleteButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#B33B3B',
    marginTop: 25,
  },
  deleteButtonDisabled: { opacity: 0.4 },
  deleteButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  overlayText: { fontSize: 14, color: '#555555' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalBody: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDDDDD',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#222222',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#B33B3B',
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomRightRadius: 20,
  },
  modalDeleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
