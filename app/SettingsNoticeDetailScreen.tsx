import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchNotice, type Notice } from '@/src/api/notices';
import { htmlToPlainText } from '@/src/utils/htmlText';

const COLORS = {
  primary: '#2C8C55',
  text: '#222222',
  subtitle: '#707070',
  border: '#E6E6E6',
  background: '#FFFFFF',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SettingsNoticeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const noticeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!noticeId) {
        setError('공지사항 ID가 없습니다.');
        setLoading(false);
        return;
      }
      try {
        const data = await fetchNotice(noticeId);
        if (active) setNotice(data);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : '공지사항을 불러오지 못했습니다.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [noticeId]);

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
      ) : error || !notice ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? '공지사항을 찾을 수 없습니다.'}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>목록으로 돌아가기</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.metaRow}>
            <View style={styles.noticeBadge}>
              <Ionicons name="megaphone-outline" size={11} color={COLORS.primary} />
              <Text style={styles.noticeBadgeText}>공지사항</Text>
            </View>
          </View>
          <Text style={styles.title}>{notice.title}</Text>
          <Text style={styles.date}>{formatDate(notice.published_at ?? notice.created_at)}</Text>
          <View style={styles.divider} />
          <Text style={styles.bodyText}>{htmlToPlainText(notice.content)}</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  content: { padding: 22, paddingBottom: 40 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
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
  title: { fontSize: 22, lineHeight: 31, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 12, color: '#999999', marginTop: 10 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginVertical: 22 },
  bodyText: { fontSize: 15, lineHeight: 26, color: '#3A3A3A' },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: COLORS.subtitle },
  backButton: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
  },
  backButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
