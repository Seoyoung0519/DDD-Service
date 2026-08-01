import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchAdminInquiries, type Inquiry, type InquiryStatus } from '@/src/api/inquiries';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

type Filter = InquiryStatus | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '답변 대기' },
  { value: 'answered', label: '답변 완료' },
  { value: 'closed', label: '종료' },
];
const STATUS: Record<InquiryStatus, { label: string; color: string; background: string }> = {
  open: { label: '답변 대기', color: '#8A6300', background: '#FFF3C8' },
  answered: { label: '답변 완료', color: '#237847', background: '#E5F4EB' },
  closed: { label: '종료', color: '#777777', background: '#EEEEEE' },
};

function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
}

function AdminInquiryManagementContent() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (next: Filter, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminInquiries(next === 'all' ? undefined : next));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '문의 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(filter), [filter, load]));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminDashboardScreen')} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>문의 관리</Text>
        <Pressable
          style={styles.headerAction}
          onPress={() => router.push('/AdminInquiryEditorScreen')}
          accessibilityLabel="문의 수동 등록">
          <Ionicons name="add" size={26} color="#2C8C55" />
        </Pressable>
      </View>
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.filterChip, filter === option.value && styles.filterChipActive]}
              onPress={() => setFilter(option.value)}>
              <Text style={[styles.filterText, filter === option.value && styles.filterTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(filter, true)}
              colors={['#2C8C55']}
            />
          }>
          <Text style={styles.count}>문의 {items.length}건</Text>
          {error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.error}>{error}</Text>
              <Pressable style={styles.retry} onPress={() => void load(filter)}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={40} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>해당 상태의 문의가 없습니다.</Text>
            </View>
          ) : (
            items.map((item) => {
              const status = STATUS[item.status];
              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/AdminInquiryDetailScreen',
                      params: { id: item.id },
                    })
                  }>
                  <View style={styles.cardTop}>
                    <Text style={styles.subject} numberOfLines={2}>{item.subject}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.preview} numberOfLines={2}>{item.content || '문의 상세 보기'}</Text>
                  {item.user_id ? <Text style={styles.meta}>문의자 {item.user_id}</Text> : null}
                  <View style={styles.bottomRow}>
                    <Text style={styles.meta}>{formatDate(item.created_at)}</Text>
                    <Ionicons name="chevron-forward" size={19} color="#AAAAAA" />
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function AdminInquiryManagementScreen() {
  return (
    <AdminRouteGuard>
      <AdminInquiryManagementContent />
    </AdminRouteGuard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },
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
  headerAction: { width: 28, alignItems: 'flex-end' },
  filterWrap: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  filters: { gap: 8, paddingHorizontal: 16, paddingVertical: 11 },
  filterChip: { borderRadius: 18, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F1F1F1' },
  filterChipActive: { backgroundColor: '#2C8C55' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666666' },
  filterTextActive: { color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 38, gap: 11 },
  count: { fontSize: 14, fontWeight: '700', color: '#444444' },
  emptyCard: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#666666' },
  error: { fontSize: 13, lineHeight: 19, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  card: { padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  subject: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '700', color: '#222222' },
  statusBadge: { borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  preview: { fontSize: 13, lineHeight: 19, color: '#666666', marginTop: 8, marginBottom: 9 },
  meta: { fontSize: 11, lineHeight: 17, color: '#888888' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
