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

import { fetchNotices, type Notice } from '@/src/api/notices';

const COLORS = {
  primary: '#2C8C55',
  text: '#222222',
  subtitle: '#707070',
  border: '#E6E6E6',
  background: '#F7F7F7',
  card: '#FFFFFF',
};

function formatNoticeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function SettingsNoticesScreen() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const items = await fetchNotices();
      setNotices(
        [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '공지사항을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>공지사항</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }>
          {error ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => void load()}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : notices.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="megaphone-outline" size={36} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>등록된 공지사항이 없습니다.</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {notices.map((notice, index) => (
                <React.Fragment key={notice.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    style={styles.noticeRow}
                    onPress={() =>
                      router.push({
                        pathname: '/SettingsNoticeDetailScreen',
                        params: { id: notice.id },
                      })
                    }>
                    <View style={styles.noticeTextWrap}>
                      <View style={styles.metaRow}>
                        <View style={styles.noticeBadge}>
                          <Ionicons name="megaphone-outline" size={11} color={COLORS.primary} />
                          <Text style={styles.noticeBadgeText}>공지</Text>
                        </View>
                        <Text style={styles.dateText}>
                          {formatNoticeDate(notice.published_at ?? notice.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.noticeTitle} numberOfLines={2}>
                        {notice.title}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={19} color="#999999" />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    color: COLORS.text,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }),
  },
  headerSpacer: { width: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 36 },
  stateCard: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 14, color: COLORS.subtitle },
  errorText: { fontSize: 13, lineHeight: 20, color: '#B44747', textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: COLORS.primary,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  listCard: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noticeRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noticeTextWrap: { flex: 1, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  noticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#EAF5EF',
  },
  noticeBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  dateText: { fontSize: 11, color: '#999999' },
  noticeTitle: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: COLORS.text },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    backgroundColor: COLORS.border,
  },
});
