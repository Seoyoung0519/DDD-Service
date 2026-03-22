/**
 * 장소 검색 후보 한 줄 — 왼쪽 위치 핀, 가운데 장소명+주소, API 제공 시 우측 카테고리·거리
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { CommutePlace } from '@/src/types/commute';

import { HighlightedSearchText } from './HighlightedSearchText';

function formatDistanceMeters(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

type Props = {
  item: CommutePlace;
  query: string;
  onPress: () => void;
  /** 자동완성 드롭다운 vs 전체 검색 목록 */
  density?: 'compact' | 'comfortable';
  /** 행 컨테이너 추가 스타일 (예: 드롭다운 패딩) */
  containerStyle?: StyleProp<ViewStyle>;
};

export function CommutePlaceSuggestionRow({
  item,
  query,
  onPress,
  density = 'compact',
  containerStyle,
}: Props) {
  const showRight = Boolean(item.category || item.distanceMeters != null);
  const verticalPad = density === 'comfortable' ? 14 : 12;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { paddingVertical: verticalPad },
        pressed && styles.pressed,
        containerStyle,
      ]}
      onPress={onPress}>
      <Ionicons name="location-outline" size={20} color="#888" style={styles.pin} />
      <View style={styles.middle}>
        <HighlightedSearchText
          fullText={item.label}
          query={query}
          style={styles.title}
        />
        {item.subtitle ? (
          <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      {showRight ? (
        <View style={styles.right}>
          {item.category ? (
            <Text style={styles.category} numberOfLines={1}>
              {item.category}
            </Text>
          ) : null}
          {item.distanceMeters != null ? (
            <Text style={styles.distance}>{formatDistanceMeters(item.distanceMeters)}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EAEAEA',
    gap: 10,
    backgroundColor: '#fff',
  },
  pressed: {
    backgroundColor: '#F7F7F7',
  },
  pin: {
    alignSelf: 'center',
  },
  middle: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  address: {
    fontSize: 13,
    color: '#7A7A7A',
  },
  right: {
    flexShrink: 0,
    maxWidth: '30%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  category: {
    fontSize: 13,
    color: '#7A7A7A',
    textAlign: 'right',
  },
  distance: {
    fontSize: 13,
    color: '#7A7A7A',
    textAlign: 'right',
  },
});
