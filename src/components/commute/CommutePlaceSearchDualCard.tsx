/**
 * 출·도착지 — 단일 둥근 카드 안에 출발/도착 두 줄 + 행마다 오른쪽 검색 아이콘
 * 자동완성(최대 4) + 아이콘 탭 시 전체 검색 화면
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  COMMUTE_PLACES_AUTOCOMPLETE_MAX,
  searchCommutePlaces,
} from '@/src/api/commutePlaces';
import {
  bumpCommuteInlineSearchGen,
  getCommuteInlineSearchGenSnapshot,
  subscribeCommuteInlineSearchGen,
  type CommutePlacePickField,
} from '@/src/state/commutePlaceSelection';
import type { CommutePlace } from '@/src/types/commute';

import { CommutePlaceSuggestionRow } from './CommutePlaceSuggestionRow';

const AUTOCOMPLETE_MAX = COMMUTE_PLACES_AUTOCOMPLETE_MAX;
const DEBOUNCE_MS = 280;
const PRIMARY = '#2C8C55';

type Props = {
  departure: string;
  arrival: string;
  onChangeDeparture: (text: string) => void;
  onChangeArrival: (text: string) => void;
  onSelectOrigin: (place: CommutePlace) => void;
  onSelectDestination: (place: CommutePlace) => void;
  /**
   * true면 자동완성 검색·드롭다운을 켜지 않음 (전체 검색 화면에서 선택 후 복귀 시 등)
   * 사용자가 입력을 바꾸면 부모에서 false로 돌려 주세요.
   */
  suppressInlineSuggestions?: boolean;
};

export function CommutePlaceSearchDualCard({
  departure,
  arrival,
  onChangeDeparture,
  onChangeArrival,
  onSelectOrigin,
  onSelectDestination,
  suppressInlineSuggestions = false,
}: Props) {
  const router = useRouter();
  const [activeField, setActiveField] = useState<'origin' | 'destination'>('origin');
  const [suggestions, setSuggestions] = useState<CommutePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 증가 시 진행 중인 자동완성 응답 무시 (전체 검색 이동·suppress·새 검색) */
  const searchSeqRef = useRef(0);
  const suppressRef = useRef(suppressInlineSuggestions);
  suppressRef.current = suppressInlineSuggestions;

  /** 전체 검색에서 선택·돋보기 탭 등 bump 시 즉시 리렌더 → 아래 useLayoutEffect에서 후보 제거 */
  const inlineSearchGen = useSyncExternalStore(
    subscribeCommuteInlineSearchGen,
    getCommuteInlineSearchGenSnapshot,
    getCommuteInlineSearchGenSnapshot,
  );
  const skipInlineGenLayout = useRef(true);
  useLayoutEffect(() => {
    if (skipInlineGenLayout.current) {
      skipInlineGenLayout.current = false;
      return;
    }
    searchSeqRef.current += 1;
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
  }, [inlineSearchGen]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const seq = ++searchSeqRef.current;
    setLoading(true);
    try {
      const list = await searchCommutePlaces(q, { size: AUTOCOMPLETE_MAX });
      if (seq !== searchSeqRef.current) return;
      if (suppressRef.current) return;
      setSuggestions(list);
      setOpen(true);
    } catch (e) {
      console.warn('[CommutePlaceSearchDualCard]', e);
      if (seq === searchSeqRef.current) {
        setSuggestions([]);
      }
    } finally {
      if (seq === searchSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (suppressInlineSuggestions) {
      searchSeqRef.current += 1;
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    const q = activeField === 'origin' ? departure.trim() : arrival.trim();
    if (!q) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(q);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [departure, arrival, activeField, runSearch, suppressInlineSuggestions]);

  /** 돋보기: 전체 검색 화면만 열기 (후보 행 탭과 분리) */
  const goFullSearch = useCallback(
    (field: CommutePlacePickField) => {
      Keyboard.dismiss();
      bumpCommuteInlineSearchGen();
      setOpen(false);
      setSuggestions([]);
      setLoading(false);
      const q = field === 'origin' ? departure.trim() : arrival.trim();
      router.push({
        pathname: '/CommutePlaceSearchScreen',
        params: { field, q },
      });
    },
    [router, departure, arrival],
  );

  /** 드롭다운 후보: 스택 이동 없이 입력칸에만 반영 */
  const onPick = useCallback(
    (p: CommutePlace) => {
      Keyboard.dismiss();
      if (activeField === 'origin') {
        onSelectOrigin(p);
      } else {
        onSelectDestination(p);
      }
      setOpen(false);
      setSuggestions([]);
    },
    [activeField, onSelectOrigin, onSelectDestination],
  );

  const queryForHighlight = activeField === 'origin' ? departure.trim() : arrival.trim();

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {/* 출발지 */}
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="출발지 입력"
            placeholderTextColor="#999"
            value={departure}
            onChangeText={(t) => {
              setActiveField('origin');
              onChangeDeparture(t);
            }}
            onFocus={() => {
              setActiveField('origin');
              if (suppressRef.current) return;
              if (departure.trim() && suggestions.length > 0) setOpen(true);
            }}
            autoCorrect={false}
            autoCapitalize="none"
            multiline={false}
            scrollEnabled={false}
            {...Platform.select({
              android: { numberOfLines: 1 },
            })}
          />
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              goFullSearch('origin');
            }}
            hitSlop={12}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="출발지 검색">
            {loading && activeField === 'origin' ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Ionicons name="search-outline" size={22} color="#666" />
            )}
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* 도착지 */}
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="도착지 입력"
            placeholderTextColor="#999"
            value={arrival}
            onChangeText={(t) => {
              setActiveField('destination');
              onChangeArrival(t);
            }}
            onFocus={() => {
              setActiveField('destination');
              if (suppressRef.current) return;
              if (arrival.trim() && suggestions.length > 0) setOpen(true);
            }}
            autoCorrect={false}
            autoCapitalize="none"
            multiline={false}
            scrollEnabled={false}
            {...Platform.select({
              android: { numberOfLines: 1 },
            })}
          />
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              goFullSearch('destination');
            }}
            hitSlop={12}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="도착지 검색">
            {loading && activeField === 'destination' ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Ionicons name="search-outline" size={22} color="#666" />
            )}
          </Pressable>
        </View>
      </View>

      {open && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((item) => (
            <CommutePlaceSuggestionRow
              key={`${item.placeId}-${item.label}`}
              item={item}
              query={queryForHighlight}
              onPress={() => onPick(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** 카드 + 드롭다운이 세로로 이어져 후보 수만큼 높이 증가 */
  wrap: {
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 48 : 46,
    paddingLeft: 16,
    paddingRight: 8,
    minWidth: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: '#222',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    overflow: 'hidden',
  },
  iconBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    zIndex: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E8E8',
    width: '100%',
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
    }),
  },
});
