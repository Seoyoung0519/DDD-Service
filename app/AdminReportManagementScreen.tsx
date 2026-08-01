import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchAdminReports, type Report, type ReportStatus } from '@/src/api/reports';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

type Filter = ReportStatus | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '접수' },
  { value: 'resolved', label: '처리 완료' },
  { value: 'dismissed', label: '기각' },
];

const STATUS_STYLE: Record<ReportStatus, { label: string; color: string; background: string }> = {
  pending: { label: '접수', color: '#8A6300', background: '#FFF3C8' },
  resolved: { label: '처리 완료', color: '#237847', background: '#E5F4EB' },
  dismissed: { label: '기각', color: '#777777', background: '#EEEEEE' },
};

const TARGET_LABEL = { user: '사용자', review: '피드', comment: '댓글' } as const;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
}

function AdminReportManagementContent() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextFilter: Filter, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setReports(await fetchAdminReports(nextFilter === 'all' ? undefined : nextFilter));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '신고 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(filter);
    }, [filter, load]),
  );

  const changeFilter = (next: Filter) => {
    if (next === filter) return;
    setFilter(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminDashboardScreen')} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>신고 관리</Text>
        <Pressable
          style={styles.headerAction}
          onPress={() => router.push('/AdminReportEditorScreen')}
          accessibilityLabel="관리자 신고 수동 등록">
          <Ionicons name="add" size={26} color="#2C8C55" />
        </Pressable>
      </View>

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable
              key={item.value}
              style={[styles.filterChip, filter === item.value && styles.filterChipActive]}
              onPress={() => changeFilter(item.value)}>
              <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2C8C55" />
        </View>
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
          <Text style={styles.count}>신고 {reports.length}건</Text>
          {error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.error}>{error}</Text>
              <Pressable style={styles.retry} onPress={() => void load(filter)}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="flag-outline" size={38} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>해당 상태의 신고가 없습니다.</Text>
            </View>
          ) : (
            reports.map((report) => {
              const status = STATUS_STYLE[report.status];
              return (
                <Pressable
                  key={report.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/AdminReportDetailScreen',
                      params: { id: report.id },
                    })
                  }>
                  <View style={styles.cardTop}>
                    <View style={styles.targetBadge}>
                      <Ionicons
                        name={report.target_type === 'user' ? 'person-outline' : 'document-text-outline'}
                        size={14}
                        color="#2C8C55"
                      />
                      <Text style={styles.targetText}>{TARGET_LABEL[report.target_type]} 신고</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.reason} numberOfLines={1}>{report.reason}</Text>
                  <Text style={styles.description} numberOfLines={2}>
                    {report.description || '상세 설명 없음'}
                  </Text>
                  <Text style={styles.meta}>신고자 {report.reporter_user_id}</Text>
                  <Text style={styles.meta}>{formatDate(report.created_at)}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#AAAAAA" style={styles.chevron} />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function AdminReportManagementScreen() {
  return (
    <AdminRouteGuard>
      <AdminReportManagementContent />
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    color: '#222222',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  },
  headerAction: { width: 28, alignItems: 'flex-end' },
  filterWrap: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
  filters: { gap: 8, paddingHorizontal: 16, paddingVertical: 11 },
  filterChip: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F1F1F1',
  },
  filterChipActive: { backgroundColor: '#2C8C55' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666666' },
  filterTextActive: { color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 38, gap: 11 },
  count: { fontSize: 14, fontWeight: '700', color: '#444444', marginBottom: 2 },
  emptyCard: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E4',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#666666' },
  error: { fontSize: 13, lineHeight: 19, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  card: {
    position: 'relative',
    padding: 15,
    paddingRight: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E4',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  targetBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  targetText: { fontSize: 12, fontWeight: '700', color: '#2C8C55' },
  statusBadge: { borderRadius: 11, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  reason: { fontSize: 15, fontWeight: '700', color: '#222222', marginBottom: 5 },
  description: { fontSize: 13, lineHeight: 19, color: '#666666', marginBottom: 10 },
  meta: { fontSize: 11, lineHeight: 17, color: '#888888' },
  chevron: { position: 'absolute', right: 12, top: '52%' },
});
