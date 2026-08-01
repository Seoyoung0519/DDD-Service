import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteAdminNotice, fetchAdminNotices, type Notice } from '@/src/api/notices';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

type SearchField = 'all' | 'title' | 'content' | 'status';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '본문' },
  { value: 'status', label: '게시 상태' },
];

function formatDate(value: string | null): string {
  if (!value) return '게시일 미지정';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
}

function AdminNoticeManagementContent() {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko-KR');
    if (!keyword) return items;
    return items.filter((item) => {
      const status = item.is_published
        ? '게시 중 게시 공개 published'
        : '미게시 임시 저장 비공개 draft';
      const values: Record<SearchField, string[]> = {
        all: [item.title, item.content, status],
        title: [item.title],
        content: [item.content],
        status: [status],
      };
      return values[searchField].some((value) =>
        value.toLocaleLowerCase('ko-KR').includes(keyword),
      );
    });
  }, [items, query, searchField]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminNotices());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '공지 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  const confirmDelete = (notice: Notice) => {
    Alert.alert('공지 삭제', `“${notice.title}” 공지를 완전히 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeletingId(notice.id);
            try {
              await deleteAdminNotice(notice.id);
              setItems((current) => current.filter((item) => item.id !== notice.id));
            } catch (reason) {
              Alert.alert('삭제 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
            } finally {
              setDeletingId(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminDashboardScreen')} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>공지사항 관리</Text>
        <Pressable style={styles.headerAction} onPress={() => router.push('/AdminNoticeEditorScreen')}>
          <Ionicons name="add" size={26} color="#2C8C55" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={['#2C8C55']} />
          }>
          <View style={styles.searchFieldRow}>
            {SEARCH_FIELDS.map((field) => (
              <Pressable
                key={field.value}
                style={[
                  styles.searchFieldChip,
                  searchField === field.value && styles.searchFieldChipActive,
                ]}
                onPress={() => setSearchField(field.value)}>
                <Text
                  style={[
                    styles.searchFieldText,
                    searchField === field.value && styles.searchFieldTextActive,
                  ]}>
                  {field.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color="#888888" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={`${SEARCH_FIELDS.find((field) => field.value === searchField)?.label ?? '전체'} 기준 검색`}
              placeholderTextColor="#999999"
              returnKeyType="search"
              autoCorrect={false}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="검색어 지우기">
                <Ionicons name="close-circle" size={20} color="#AAAAAA" />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.intro}>
            <View>
              <Text style={styles.count}>
                {query.trim() ? `검색 결과 ${filteredItems.length}개 · 전체 ${items.length}개` : `전체 ${items.length}개`}
              </Text>
              <Text style={styles.introText}>게시된 공지만 사용자 설정 화면에 노출됩니다.</Text>
            </View>
          </View>
          {error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.error}>{error}</Text>
              <Pressable style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>다시 시도</Text></Pressable>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="megaphone-outline" size={40} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>등록된 공지사항이 없습니다.</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={40} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
              <Text style={styles.emptyHint}>제목, 본문 또는 게시 상태를 다시 확인해 주세요.</Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const deleting = deletingId === item.id;
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    <View style={[styles.statusBadge, item.is_published ? styles.published : styles.draft]}>
                      <Text style={[styles.statusText, item.is_published ? styles.publishedText : styles.draftText]}>
                        {item.is_published ? '게시 중' : '미게시'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.preview} numberOfLines={3}>{item.content || '본문 없음'}</Text>
                  <Text style={styles.date}>{formatDate(item.published_at ?? item.created_at)}</Text>
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() =>
                        router.push({ pathname: '/AdminNoticeEditorScreen', params: { id: item.id } })
                      }>
                      <Ionicons name="create-outline" size={17} color="#2C8C55" />
                      <Text style={styles.editText}>편집</Text>
                    </Pressable>
                    <Pressable style={styles.deleteButton} disabled={deleting} onPress={() => confirmDelete(item)}>
                      {deleting ? <ActivityIndicator size="small" color="#C83E3E" /> : (
                        <>
                          <Ionicons name="trash-outline" size={17} color="#C83E3E" />
                          <Text style={styles.deleteText}>삭제</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function AdminNoticeManagementScreen() {
  return (
    <AdminRouteGuard>
      <AdminNoticeManagementContent />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 38, gap: 12 },
  searchFieldRow: { flexDirection: 'row', gap: 7 },
  searchFieldChip: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  searchFieldChipActive: { borderColor: '#2C8C55', backgroundColor: '#EAF5EF' },
  searchFieldText: { fontSize: 12, fontWeight: '600', color: '#777777' },
  searchFieldTextActive: { color: '#235D3C' },
  searchWrap: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#222222', paddingVertical: 0 },
  intro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  count: { fontSize: 16, fontWeight: '700', color: '#222222', marginBottom: 4 },
  introText: { fontSize: 12, color: '#707070' },
  emptyCard: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, borderRadius: 14, borderWidth: 1, borderColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#666666' },
  emptyHint: { fontSize: 12, lineHeight: 18, textAlign: 'center', color: '#888888' },
  error: { fontSize: 13, lineHeight: 19, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  card: { padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '700', color: '#222222' },
  statusBadge: { borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 },
  published: { backgroundColor: '#E5F4EB' },
  draft: { backgroundColor: '#EEEEEE' },
  statusText: { fontSize: 11, fontWeight: '700' },
  publishedText: { color: '#237847' },
  draftText: { color: '#777777' },
  preview: { fontSize: 13, lineHeight: 19, color: '#666666', marginTop: 9 },
  date: { fontSize: 11, color: '#999999', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  editButton: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 9, backgroundColor: '#EAF5EF' },
  editText: { fontSize: 13, fontWeight: '700', color: '#2C8C55' },
  deleteButton: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 9, backgroundColor: '#FDECEC' },
  deleteText: { fontSize: 13, fontWeight: '700', color: '#C83E3E' },
});
