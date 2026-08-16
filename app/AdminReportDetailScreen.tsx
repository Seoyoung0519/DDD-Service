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
  deleteAdminReport,
  fetchAdminReport,
  updateAdminReport,
  type Report,
  type ReportStatus,
} from '@/src/api/reports';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';
import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: '접수' },
  { value: 'resolved', label: '처리 완료' },
  { value: 'dismissed', label: '기각' },
];

const TARGET_LABEL = { user: '사용자', review: '피드', comment: '댓글' } as const;

function formatDate(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} selectable>{value}</Text>
    </View>
  );
}

function AdminReportDetailContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<ReportStatus>('pending');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('신고 ID가 없습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminReport(id);
      setReport(data);
      setStatus(data.status);
      setAdminNote(data.admin_note ?? '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '신고 상세를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!id || saving) return;
    setSaving(true);
    try {
      const updated = await updateAdminReport(id, {
        status,
        admin_note: adminNote.trim() || null,
      });
      setReport(updated);
      setStatus(updated.status);
      setAdminNote(updated.admin_note ?? '');
      Alert.alert('저장 완료', '신고 처리 상태가 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => router.replace('/AdminReportManagementScreen'),
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
    Alert.alert('신고 내역 삭제', '이 신고 내역을 완전히 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            try {
              await deleteAdminReport(id);
              router.replace('/AdminReportManagementScreen');
            } catch (reason) {
              Alert.alert(
                '삭제 실패',
                reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.',
              );
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
        <Pressable onPress={() => router.replace('/AdminReportManagementScreen')} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>신고 상세</Text>
        <Pressable onPress={confirmDelete} disabled={deleting} hitSlop={10}>
          {deleting ? (
            <ActivityIndicator size="small" color="#C83E3E" />
          ) : (
            <Ionicons name="trash-outline" size={23} color="#C83E3E" />
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : error || !report ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error || '신고 내역이 없습니다.'}</Text>
          <Pressable style={styles.retry} onPress={() => void load()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <KeyboardAwareScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>신고 정보</Text>
              <DetailRow label="신고 ID" value={report.id} />
              <DetailRow label="대상 유형" value={TARGET_LABEL[report.target_type]} />
              <DetailRow label="대상 ID" value={report.target_id} />
              <DetailRow label="신고자 ID" value={report.reporter_user_id} />
              <DetailRow label="신고 사유" value={report.reason} />
              <DetailRow label="상세 설명" value={report.description || '-'} />
              <DetailRow label="접수일" value={formatDate(report.created_at)} />
              <DetailRow label="처리일" value={formatDate(report.resolved_at)} />
              <DetailRow label="처리 관리자" value={report.resolved_by || '-'} />
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
                    <Text
                      style={[styles.statusButtonText, status === option.value && styles.statusButtonTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.noteLabel}>관리자 처리 메모</Text>
              <TextInput
                style={styles.noteInput}
                value={adminNote}
                onChangeText={setAdminNote}
                placeholder="처리 내용이나 기각 사유를 입력해 주세요."
                placeholderTextColor="#AAAAAA"
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{adminNote.length}/1000</Text>
            </View>
          </KeyboardAwareScrollView>
          <View style={styles.bottom}>
            <Pressable style={styles.saveButton} disabled={saving} onPress={() => void save()}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>저장</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

export default function AdminReportDetailScreen() {
  return (
    <AdminRouteGuard>
      <AdminReportDetailContent />
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
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7 },
  detailLabel: { width: 92, fontSize: 12, fontWeight: '600', color: '#777777' },
  detailValue: { flex: 1, fontSize: 12, lineHeight: 18, color: '#333333' },
  statusOptions: { flexDirection: 'row', gap: 7 },
  statusButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  statusButtonActive: { borderColor: '#2C8C55', backgroundColor: '#EAF5EF' },
  statusButtonText: { fontSize: 12, fontWeight: '600', color: '#777777' },
  statusButtonTextActive: { color: '#235D3C' },
  noteLabel: { fontSize: 13, fontWeight: '600', color: '#444444', marginTop: 18, marginBottom: 8 },
  noteInput: {
    minHeight: 105,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    lineHeight: 20,
    color: '#222222',
  },
  counter: { alignSelf: 'flex-end', marginTop: 5, fontSize: 11, color: '#999999' },
  bottom: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  saveButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#2C8C55' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
