import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createAdminReport, type ReportTargetType } from '@/src/api/reports';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

type SupportedTarget = Extract<ReportTargetType, 'user' | 'review'>;

function AdminReportEditorContent() {
  const router = useRouter();
  const [reporterId, setReporterId] = useState('');
  const [targetType, setTargetType] = useState<SupportedTarget>('review');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const cleanReporter = reporterId.trim();
    const cleanTarget = targetId.trim();
    const cleanReason = reason.trim();
    if (!cleanReporter || !cleanTarget || !cleanReason) {
      Alert.alert('입력 확인', '신고자 ID, 대상 ID, 신고 사유를 모두 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const created = await createAdminReport({
        reporter_user_id: cleanReporter,
        target_type: targetType,
        target_id: cleanTarget,
        reason: cleanReason,
        description: description.trim() || null,
      });
      router.replace({
        pathname: '/AdminReportDetailScreen',
        params: { id: created.id },
      });
    } catch (error) {
      Alert.alert('등록 실패', error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminReportManagementScreen')} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>신고 수동 등록</Text>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.description}>
            관리자 권한으로 신고 내역을 직접 등록합니다. 댓글 기능은 현재 앱에 없어 대상에서 제외했습니다.
          </Text>

          <Text style={styles.label}>신고자 사용자 ID *</Text>
          <TextInput
            style={styles.input}
            value={reporterId}
            onChangeText={setReporterId}
            placeholder="user UUID"
            placeholderTextColor="#AAAAAA"
            autoCapitalize="none"
          />

          <Text style={styles.label}>신고 대상 *</Text>
          <View style={styles.targetOptions}>
            {([
              { value: 'review', label: '피드 게시물', icon: 'document-text-outline' },
              { value: 'user', label: '사용자', icon: 'person-outline' },
            ] as const).map((option) => (
              <Pressable
                key={option.value}
                style={[styles.targetButton, targetType === option.value && styles.targetButtonActive]}
                onPress={() => setTargetType(option.value)}>
                <Ionicons
                  name={option.icon}
                  size={19}
                  color={targetType === option.value ? '#2C8C55' : '#777777'}
                />
                <Text style={[styles.targetText, targetType === option.value && styles.targetTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>대상 ID *</Text>
          <TextInput
            style={styles.input}
            value={targetId}
            onChangeText={setTargetId}
            placeholder={targetType === 'review' ? 'review UUID' : 'user UUID'}
            placeholderTextColor="#AAAAAA"
            autoCapitalize="none"
          />

          <Text style={styles.label}>신고 사유 *</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="예: 욕설·비방"
            placeholderTextColor="#AAAAAA"
            maxLength={100}
          />

          <Text style={styles.label}>상세 설명 (선택)</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="신고 내용을 입력해 주세요."
            placeholderTextColor="#AAAAAA"
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
        </ScrollView>
        <View style={styles.bottom}>
          <Pressable style={styles.saveButton} disabled={saving} onPress={() => void save()}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>신고 등록</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function AdminReportEditorScreen() {
  return (
    <AdminRouteGuard>
      <AdminReportEditorContent />
    </AdminRouteGuard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },
  flex: { flex: 1 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E4',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#222222' },
  headerSpacer: { width: 28 },
  content: { padding: 18, paddingBottom: 28 },
  description: { fontSize: 13, lineHeight: 20, color: '#666666', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#444444', marginTop: 15, marginBottom: 8 },
  input: {
    height: 48,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#222222',
  },
  targetOptions: { flexDirection: 'row', gap: 9 },
  targetButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  targetButtonActive: { borderColor: '#79B793', backgroundColor: '#EAF5EF' },
  targetText: { fontSize: 13, fontWeight: '600', color: '#777777' },
  targetTextActive: { color: '#235D3C' },
  descriptionInput: { height: 115, paddingVertical: 12 },
  bottom: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  saveButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#2C8C55' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
