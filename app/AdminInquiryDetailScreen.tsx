import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteAdminInquiry,
  fetchAdminInquiry,
  updateAdminInquiry,
  type Inquiry,
  type InquiryStatus,
} from '@/src/api/inquiries';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';
import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: 'open', label: '답변 대기' },
  { value: 'answered', label: '답변 완료' },
  { value: 'closed', label: '종료' },
];

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
}

function AdminInquiryDetailContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [item, setItem] = useState<Inquiry | null>(null);
  const [status, setStatus] = useState<InquiryStatus>('open');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('문의 ID가 없습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminInquiry(id);
      setItem(data);
      setStatus(data.status);
      setReply(data.admin_reply ?? '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '문의 상세를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => void load(), [load]);

  const save = async () => {
    if (!id || saving) return;
    if (status === 'answered' && !reply.trim()) {
      Alert.alert('답변 확인', '답변 완료 상태에는 관리자 답변이 필요합니다.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAdminInquiry(id, {
        status,
        admin_reply: reply.trim() || null,
      });
      setItem(updated);
      setStatus(updated.status);
      setReply(updated.admin_reply ?? '');
      Alert.alert('저장 완료', '문의 답변과 상태가 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => router.replace('/AdminInquiryManagementScreen'),
        },
      ]);
    } catch (reason) {
      Alert.alert('저장 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!id || deleting) return;
    Alert.alert('문의 삭제', '이 문의 내역을 완전히 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            try {
              await deleteAdminInquiry(id);
              router.replace('/AdminInquiryManagementScreen');
            } catch (reason) {
              Alert.alert('삭제 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminInquiryManagementScreen')} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>문의 상세</Text>
        <Pressable onPress={confirmDelete} disabled={deleting} hitSlop={10}>
          {deleting ? <ActivityIndicator size="small" color="#C83E3E" /> : <Ionicons name="trash-outline" size={23} color="#C83E3E" />}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : error || !item ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error || '문의 내역이 없습니다.'}</Text>
          <Pressable style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>다시 시도</Text></Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <KeyboardAwareScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>문의 정보</Text>
              <Text style={styles.meta}>문의자  {item.user_id || '-'}</Text>
              <Text style={styles.meta}>문의일  {formatDate(item.created_at)}</Text>
              <View style={styles.divider} />
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.question}>{item.content || '문의 내용이 없습니다.'}</Text>
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>처리 상태</Text>
              <View style={styles.statusOptions}>
                {STATUS_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[styles.statusButton, status === option.value && styles.statusButtonActive]}
                    onPress={() => setStatus(option.value)}>
                    <Text style={[styles.statusButtonText, status === option.value && styles.statusButtonTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.replyLabel}>관리자 답변</Text>
              <TextInput
                style={styles.replyInput}
                value={reply}
                onChangeText={(value) => {
                  setReply(value);
                  if (value.trim() && status === 'open') setStatus('answered');
                }}
                placeholder="사용자에게 전달할 답변을 입력해 주세요."
                placeholderTextColor="#AAAAAA"
                multiline
                maxLength={2000}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{reply.length}/2000</Text>
              {item.replied_at ? (
                <Text style={styles.replyMeta}>
                  최근 답변 {formatDate(item.replied_at)} · {item.replied_by || '관리자'}
                </Text>
              ) : null}
            </View>
          </KeyboardAwareScrollView>
          <View style={styles.bottom}>
            <Pressable style={styles.saveButton} disabled={saving} onPress={() => void save()}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>답변 저장</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

export default function AdminInquiryDetailScreen() {
  return (
    <AdminRouteGuard>
      <AdminInquiryDetailContent />
    </AdminRouteGuard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  error: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingVertical: 22, paddingBottom: 28 },
  section: { width: '100%' },
  sectionDivider: { height: 1, backgroundColor: '#D5D5D5', marginVertical: 26 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222222', marginBottom: 13 },
  meta: { fontSize: 11, lineHeight: 18, color: '#888888' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5E5', marginVertical: 14 },
  subject: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: '#222222', marginBottom: 10 },
  question: { fontSize: 14, lineHeight: 22, color: '#444444' },
  statusOptions: { flexDirection: 'row', gap: 7 },
  statusButton: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: '#DDDDDD' },
  statusButtonActive: { borderColor: '#2C8C55', backgroundColor: '#EAF5EF' },
  statusButtonText: { fontSize: 11, fontWeight: '600', color: '#777777' },
  statusButtonTextActive: { color: '#235D3C' },
  replyLabel: { fontSize: 13, fontWeight: '700', color: '#444444', marginTop: 18, marginBottom: 8 },
  replyInput: {
    minHeight: 150,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    lineHeight: 21,
    color: '#222222',
  },
  counter: { alignSelf: 'flex-end', marginTop: 5, fontSize: 11, color: '#999999' },
  replyMeta: { fontSize: 11, color: '#888888', marginTop: 8 },
  bottom: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  saveButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#2C8C55' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
