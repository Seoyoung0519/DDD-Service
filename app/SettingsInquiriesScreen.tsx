import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMyInquiries, type Inquiry, type InquiryStatus } from '@/src/api/inquiries';

type SearchField = 'subject' | 'content';

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'subject', label: '문의 제목' },
  { value: 'content', label: '문의 내용' },
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

export default function SettingsInquiriesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('subject');

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko-KR');
    if (!keyword) return items;
    return items.filter((item) => {
      const value = searchField === 'subject' ? item.subject : item.content ?? '';
      return value.toLocaleLowerCase('ko-KR').includes(keyword);
    });
  }, [items, query, searchField]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setItems(await fetchMyInquiries());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '문의 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>1:1 문의</Text>
        <Pressable
          style={styles.headerAction}
          onPress={() => router.push('/SettingsInquiryEditorScreen')}
          accessibilityLabel="새 문의 작성">
          <Ionicons name="add" size={26} color="#2C8C55" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              colors={['#2C8C55']}
            />
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
              placeholder={`${searchField === 'subject' ? '문의 제목' : '문의 내용'} 검색`}
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
              <Text style={styles.introTitle}>
                {query.trim()
                  ? `검색 결과 ${filteredItems.length}건 · 전체 ${items.length}건`
                  : `내 문의 ${items.length}건`}
              </Text>
              <Text style={styles.introText}>등록한 문의와 관리자 답변을 확인할 수 있어요.</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.error}>{error}</Text>
              <Pressable style={styles.retry} onPress={() => void load()}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>등록한 문의가 없습니다.</Text>
              <Text style={styles.emptyText}>궁금한 점이나 불편한 점을 알려주세요.</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={40} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
              <Text style={styles.emptyText}>문의 제목이나 내용을 다시 확인해 주세요.</Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const status = STATUS[item.status];
              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/SettingsInquiryDetailScreen',
                      params: { id: item.id },
                    })
                  }>
                  <View style={styles.cardTop}>
                    <Text style={styles.subject} numberOfLines={2}>{item.subject}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.preview} numberOfLines={2}>{item.content || '문의 내용 보기'}</Text>
                  <View style={styles.cardBottom}>
                    <Text style={styles.date}>{formatDate(item.created_at)}</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 38, gap: 12 },
  searchFieldRow: { flexDirection: 'row', gap: 8 },
  searchFieldChip: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  searchFieldChipActive: { borderColor: '#2C8C55', backgroundColor: '#EAF5EF' },
  searchFieldText: { fontSize: 13, fontWeight: '600', color: '#777777' },
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
  intro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  introTitle: { fontSize: 16, fontWeight: '700', color: '#222222', marginBottom: 4 },
  introText: { fontSize: 12, color: '#707070' },
  emptyCard: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#444444' },
  emptyText: { fontSize: 13, color: '#777777' },
  error: { fontSize: 13, lineHeight: 19, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  card: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 21,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  subject: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '700', color: '#222222' },
  statusBadge: { borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  preview: { fontSize: 13, lineHeight: 19, color: '#666666', marginTop: 9 },
  cardBottom: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  date: { fontSize: 11, color: '#999999' },
});
