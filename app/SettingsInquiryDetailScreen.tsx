import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMyInquiry, type Inquiry, type InquiryStatus } from '@/src/api/inquiries';

const STATUS: Record<InquiryStatus, { label: string; color: string; background: string }> = {
  open: { label: '답변 대기', color: '#8A6300', background: '#FFF3C8' },
  answered: { label: '답변 완료', color: '#237847', background: '#E5F4EB' },
  closed: { label: '종료', color: '#777777', background: '#EEEEEE' },
};

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
}

export default function SettingsInquiryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [item, setItem] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
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
      setItem(await fetchMyInquiry(id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '문의 내용을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => void load(), [load]);

  const status = item ? STATUS[item.status] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>문의 상세</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : error || !item || !status ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error || '문의 내역이 없습니다.'}</Text>
          <Pressable style={styles.retry} onPress={() => void load()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.questionCard}>
            <View style={styles.titleRow}>
              <Text style={styles.subject}>{item.subject}</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <Text style={styles.date}>문의일 {formatDate(item.created_at)}</Text>
            <View style={styles.divider} />
            <Text style={styles.contentText}>{item.content || '문의 내용이 없습니다.'}</Text>
          </View>

          <View style={styles.answerSection}>
            <Text style={styles.answerSectionTitle}>답변</Text>
            {item.admin_reply ? (
              <View style={styles.replyCard}>
                <View style={styles.replyHeader}>
                  <View style={styles.adminIcon}>
                    <Ionicons name="chatbubble-ellipses-outline" size={19} color="#2C8C55" />
                  </View>
                  <Text style={styles.replyTitle}>대독단 관리자 답변</Text>
                </View>
                <Text style={styles.replyDate}>답변일 {formatDate(item.replied_at)}</Text>
                <Text style={styles.replyText}>{item.admin_reply}</Text>
              </View>
            ) : (
              <View style={styles.emptyAnswer}>
                <Text style={styles.emptyAnswerText}>아직 등록된 답변이 없습니다.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  error: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  content: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 38, gap: 20 },
  questionCard: {
    paddingHorizontal: 2,
    paddingTop: 8,
    paddingBottom: 22,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  subject: { flex: 1, fontSize: 17, lineHeight: 24, fontWeight: '700', color: '#222222' },
  statusBadge: { borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 11, color: '#999999', marginTop: 9 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5E5', marginVertical: 16 },
  contentText: { fontSize: 14, lineHeight: 23, color: '#444444' },
  answerSection: {
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C5C5C5',
  },
  answerSectionTitle: { fontSize: 17, fontWeight: '700', color: '#333333', marginBottom: 14 },
  emptyAnswer: { minHeight: 150, alignItems: 'center', justifyContent: 'center' },
  emptyAnswerText: { fontSize: 13, color: '#999999' },
  replyCard: { padding: 17, borderRadius: 14, borderWidth: 1, borderColor: '#DEDEDE', backgroundColor: '#F3F3F3' },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  adminIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDEFE4' },
  replyTitle: { fontSize: 14, fontWeight: '700', color: '#222222' },
  replyDate: { fontSize: 11, color: '#222222', marginTop: 11, marginBottom: 10 },
  replyText: { fontSize: 14, lineHeight: 22, color: '#222222' },
});
