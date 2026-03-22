/**
 * 출·도착지 전체 검색 결과 — 목록에서 장소 선택 후 이전 화면으로 복귀
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COMMUTE_PLACES_FULL_SEARCH_MAX,
  searchCommutePlaces,
} from '@/src/api/commutePlaces';
import { CommutePlaceSuggestionRow } from '@/src/components/commute/CommutePlaceSuggestionRow';
import {
  setCommutePlaceSelection,
  type CommutePlacePickField,
} from '@/src/state/commutePlaceSelection';
import type { CommutePlace } from '@/src/types/commute';

const PRIMARY = '#2C8C55';

export default function CommutePlaceSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ field?: string; q?: string }>();
  const field = (params.field === 'destination' ? 'destination' : 'origin') as CommutePlacePickField;

  /** 이전 화면에서 전달된 검색어 — 전체 검색 화면에는 검색 UI 없이 결과만 표시 */
  const searchQuery = useMemo(() => String(params.q ?? '').trim(), [params.q]);

  const [results, setResults] = useState<CommutePlace[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (q: string) => {
    const t = q.trim();
    if (!t) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const list = await searchCommutePlaces(t, {
        size: COMMUTE_PLACES_FULL_SEARCH_MAX,
      });
      setResults(list);
    } catch (e) {
      console.warn('[CommutePlaceSearchScreen]', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery) load(searchQuery);
    else {
      setResults([]);
      setLoading(false);
    }
  }, [searchQuery, load]);

  const onSelect = useCallback(
    (place: CommutePlace) => {
      setCommutePlaceSelection(field, place);
      router.back();
    },
    [field, router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="뒤로">
          <Ionicons name="chevron-back" size={26} color="#222" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {field === 'origin' ? '출발지 검색' : '도착지 검색'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        style={styles.list}
        data={results}
        keyExtractor={(item) => item.placeId}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : !searchQuery ? (
            <Text style={styles.empty}>검색어가 없습니다. 이전 화면에서 다시 시도해 주세요.</Text>
          ) : (
            <Text style={styles.empty}>검색 결과가 없어요.</Text>
          )
        }
        renderItem={({ item }) => (
          <CommutePlaceSuggestionRow
            item={item}
            query={searchQuery}
            onPress={() => onSelect(item)}
            density="comfortable"
            containerStyle={styles.listRowExtra}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    ...Platform.select({
      android: { fontFamily: 'sans-serif-medium' },
    }),
  },
  headerRight: {
    width: 36,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  emptyWrap: {
    paddingTop: 48,
    alignItems: 'center',
  },
  /** FlatList는 좌우 패딩을 행에 맞춤 */
  listRowExtra: {
    paddingHorizontal: 16,
    borderBottomColor: '#EEE',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 14,
  },
});
