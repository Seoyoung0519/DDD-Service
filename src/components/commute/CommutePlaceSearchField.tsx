/**
 * 출·도착지: 검색창 + 자동완성 최대 4건 + 검색 버튼(전체 결과 화면)
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  COMMUTE_PLACES_AUTOCOMPLETE_MAX,
  searchCommutePlaces,
} from '@/src/api/commutePlaces';
import type { CommutePlacePickField } from '@/src/state/commutePlaceSelection';
import type { CommutePlace } from '@/src/types/commute';

import { CommutePlaceSuggestionRow } from './CommutePlaceSuggestionRow';

const AUTOCOMPLETE_MAX = COMMUTE_PLACES_AUTOCOMPLETE_MAX;
const DEBOUNCE_MS = 280;
const PRIMARY = '#2C8C55';

type Props = {
  field: CommutePlacePickField;
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace: (place: CommutePlace) => void;
  placeholder?: string;
};

export function CommutePlaceSearchField({
  field,
  value,
  onChangeText,
  onSelectPlace,
  placeholder = '검색어를 입력하세요',
}: Props) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<CommutePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await searchCommutePlaces(q, { size: AUTOCOMPLETE_MAX });
      setSuggestions(list.slice(0, AUTOCOMPLETE_MAX));
      setOpen(true);
    } catch (e) {
      console.warn('[CommutePlaceSearchField]', e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
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
  }, [value, runSearch]);

  const goFullSearch = useCallback(() => {
    setOpen(false);
    router.push({
      pathname: '/CommutePlaceSearchScreen',
      params: {
        field,
        q: value.trim(),
      },
    });
  }, [router, field, value]);

  const onPick = useCallback(
    (p: CommutePlace) => {
      onSelectPlace(p);
      setOpen(false);
      setSuggestions([]);
    },
    [onSelectPlace],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <View style={styles.pill}>
          <Ionicons name="search" size={20} color="#888" style={styles.pillIcon} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => value.trim() && suggestions.length > 0 && setOpen(true)}
            autoCorrect={false}
            autoCapitalize="none"
            multiline={false}
            scrollEnabled={false}
            {...Platform.select({
              android: { numberOfLines: 1 },
            })}
          />
          {loading ? (
            <ActivityIndicator size="small" color={PRIMARY} style={styles.spinner} />
          ) : null}
        </View>
        <Pressable
          style={({ pressed }) => [styles.searchBtn, pressed && styles.searchBtnPressed]}
          onPress={goFullSearch}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="장소 검색">
          <Text style={styles.searchBtnText}>검색</Text>
        </Pressable>
      </View>

      {open && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((item) => (
            <CommutePlaceSuggestionRow
              key={`${item.placeId}-${item.label}`}
              item={item}
              query={value.trim()}
              onPress={() => onPick(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 20,
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 44,
    minWidth: 0,
  },
  pillIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: '#222',
    paddingVertical: 0,
    overflow: 'hidden',
  },
  spinner: {
    marginLeft: 4,
  },
  searchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#fff',
  },
  searchBtnPressed: {
    opacity: 0.75,
  },
  searchBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    maxHeight: AUTOCOMPLETE_MAX * 76,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
});
