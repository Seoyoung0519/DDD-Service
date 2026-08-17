import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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

import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';
import { createReport, type ReportTargetType } from '@/src/api/reports';

const REASONS = ['욕설·비방', '스팸·광고', '음란·부적절한 내용', '사칭·허위 정보', '기타'];

type ReportActionSheetProps = {
  visible: boolean;
  targetType: Extract<ReportTargetType, 'user' | 'review'>;
  targetId: string;
  actionLabel: string;
  startWithForm?: boolean;
  onClose: () => void;
};

export function ReportActionSheet({
  visible,
  targetType,
  targetId,
  actionLabel,
  startWithForm = false,
  onClose,
}: ReportActionSheetProps) {
  const [showForm, setShowForm] = useState(startWithForm);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowForm(startWithForm);
      setReason('');
      setDescription('');
      setSubmitting(false);
    }
  }, [startWithForm, visible]);

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await createReport({
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || null,
      });
      onClose();
      Alert.alert('신고가 접수되었습니다.');
    } catch (error) {
      Alert.alert(
        '신고 접수 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={submitting ? undefined : onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={submitting ? undefined : onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {!showForm ? (
            <>
              <Text style={styles.menuTitle}>신고 메뉴</Text>
              <Pressable style={styles.reportAction} onPress={() => setShowForm(true)}>
                <View style={styles.flagIcon}>
                  <Ionicons name="flag-outline" size={21} color="#C83E3E" />
                </View>
                <Text style={styles.reportActionText}>{actionLabel}</Text>
                <Ionicons name="chevron-forward" size={20} color="#999999" />
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.formHeader}>
                {startWithForm ? (
                  <View style={styles.formHeaderSpacer} />
                ) : (
                  <Pressable onPress={() => setShowForm(false)} disabled={submitting} hitSlop={10}>
                    <Ionicons name="chevron-back" size={24} color="#222222" />
                  </Pressable>
                )}
                <Text style={styles.formTitle}>
                  {targetType === 'user' ? '사용자 신고' : '피드 신고'}
                </Text>
                <Pressable onPress={onClose} disabled={submitting} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#555555" />
                </Pressable>
              </View>
              <KeyboardAwareScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled">
                <Text style={styles.prompt}>신고 사유를 선택해 주세요.</Text>
                <View style={styles.reasonList}>
                  {REASONS.map((item) => {
                    const selected = reason === item;
                    return (
                      <Pressable
                        key={item}
                        style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                        onPress={() => setReason(item)}>
                        <Ionicons
                          name={selected ? 'radio-button-on' : 'radio-button-off'}
                          size={21}
                          color={selected ? '#2C8C55' : '#A0A0A0'}
                        />
                        <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.inputLabel}>상세 설명 (선택)</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="신고 내용을 자세히 작성해 주세요."
                  placeholderTextColor="#AAAAAA"
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.counter}>{description.length}/500</Text>
              </KeyboardAwareScrollView>
              <Pressable
                style={[styles.submitButton, (!reason || submitting) && styles.submitDisabled]}
                disabled={!reason || submitting}
                onPress={() => void submit()}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>신고 접수</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  sheet: {
    maxHeight: '86%',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  handle: {
    width: 38,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: '#D4D4D4',
    marginBottom: 16,
  },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#222222', marginBottom: 12 },
  reportAction: {
    minHeight: 58,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
  },
  flagIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FDE5E5',
    flexShrink: 0,
  },
  reportActionText: {
    flex: 1,
    flexShrink: 1,
    marginLeft: 11,
    fontSize: 15,
    fontWeight: '700',
    color: '#B93434',
  },
  cancelButton: {
    minHeight: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#666666' },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formHeaderSpacer: { width: 24 },
  formTitle: { flex: 1, flexShrink: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#222222' },
  formScroll: { flexGrow: 0 },
  formContent: { paddingTop: 10, paddingBottom: 8 },
  prompt: { fontSize: 14, color: '#555555', marginBottom: 12 },
  reasonList: { gap: 7 },
  reasonRow: {
    minHeight: 48,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  reasonRowSelected: { borderColor: '#8BC4A4', backgroundColor: '#F0F8F3' },
  reasonText: { flex: 1, flexShrink: 1, fontSize: 14, color: '#555555' },
  reasonTextSelected: { fontWeight: '600', color: '#235D3C' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#444444', marginTop: 18, marginBottom: 8 },
  input: {
    minHeight: 98,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    fontSize: 14,
    lineHeight: 20,
    color: '#222222',
    backgroundColor: '#FAFAFA',
  },
  counter: { alignSelf: 'flex-end', marginTop: 5, fontSize: 11, color: '#999999' },
  submitButton: {
    minHeight: 52,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 26,
    backgroundColor: '#C83E3E',
  },
  submitDisabled: { opacity: 0.42 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
