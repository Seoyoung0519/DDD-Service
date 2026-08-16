import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ReadingStaminaBook } from '@/src/components/reading-stamina/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.2;
const ITEM_MARGIN = 4;
/** 아이템 너비 + 좌우 margin — 스냅·scale 기준 */
const SNAP_WIDTH = ITEM_WIDTH + ITEM_MARGIN * 2;
const SIDE_PADDING = (SCREEN_WIDTH - SNAP_WIDTH) / 2;
/** 자동 넘김 간격 (ms) */
const AUTO_ADVANCE_MS = 3500;

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

const PLACEHOLDER_COVER = require('../../../assets/images/drawer/book.png');

type Props = {
  books: ReadingStaminaBook[];
  loading?: boolean;
  emptyText?: string;
  showSelectedInfo?: boolean;
  onSelectedBookChange?: (book: ReadingStaminaBook | null) => void;
  /** 표지 탭 — 상세 페이지 등 */
  onBookPress?: (book: ReadingStaminaBook) => void;
  /** 자동 넘김 간격(ms). 0이면 비활성 */
  autoAdvanceMs?: number;
};

export function ReadingStaminaCarousel({
  books,
  loading = false,
  emptyText = '해당 쪽수 범위의 책이 없습니다.',
  showSelectedInfo = true,
  onSelectedBookChange,
  onBookPress,
  autoAdvanceMs = AUTO_ADVANCE_MS,
}: Props) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<ReadingStaminaBook>>(null);
  const selectedIndexRef = useRef(0);
  const onSelectedBookChangeRef = useRef(onSelectedBookChange);
  const [selectedIndex, setSelectedIndex] = useState(0);

  onSelectedBookChangeRef.current = onSelectedBookChange;

  /** 목록 내용이 바뀔 때만 리셋 (매 렌더마다 새 배열 참조로 리셋되지 않도록) */
  const booksKey = books.map((b) => b.id).join('|');

  const advanceToIndex = useCallback(
    (index: number, animated = true) => {
      if (books.length === 0) return;
      const nextIndex = ((index % books.length) + books.length) % books.length;
      selectedIndexRef.current = nextIndex;
      setSelectedIndex(nextIndex);
      onSelectedBookChangeRef.current?.(books[nextIndex] ?? null);
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * SNAP_WIDTH,
        animated,
      });
    },
    [books],
  );

  const advanceToIndexRef = useRef(advanceToIndex);
  advanceToIndexRef.current = advanceToIndex;

  useEffect(() => {
    selectedIndexRef.current = 0;
    setSelectedIndex(0);
    scrollX.setValue(0);
    onSelectedBookChangeRef.current?.(books[0] ?? null);
    if (books.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    }
  }, [booksKey, books.length, scrollX]);

  useEffect(() => {
    if (books.length <= 1 || autoAdvanceMs <= 0) return undefined;

    const timer = setInterval(() => {
      advanceToIndexRef.current(selectedIndexRef.current + 1);
    }, autoAdvanceMs);

    return () => clearInterval(timer);
  }, [booksKey, books.length, autoAdvanceMs]);

  const selectedBook = books[selectedIndex] ?? books[0] ?? null;

  const renderBookItem = ({ item, index }: { item: ReadingStaminaBook; index: number }) => {
    const inputRange = [
      (index - 2) * SNAP_WIDTH,
      (index - 1) * SNAP_WIDTH,
      index * SNAP_WIDTH,
      (index + 1) * SNAP_WIDTH,
      (index + 2) * SNAP_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.75, 0.85, 1.1, 0.85, 0.75],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [15, 10, -8, 10, 15],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 0.7, 1, 0.7, 0.5],
      extrapolate: 'clamp',
    });

    const coverSource = item.coverUrl ? { uri: item.coverUrl } : PLACEHOLDER_COVER;

    const cover = (
      <Animated.View
        style={[
          styles.bookCarouselItem,
          {
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}>
        <ExpoImage
          source={coverSource}
          style={styles.bookCarouselCover}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={item.id}
          allowDownscaling={false}
        />
      </Animated.View>
    );

    if (!onBookPress) return cover;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onBookPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} 상세보기`}>
        {cover}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color="#2C8C55" />
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={books.length > 1}
          pagingEnabled={false}
          snapToInterval={SNAP_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={[styles.carouselContent, { paddingHorizontal: SIDE_PADDING }]}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          onMomentumScrollEnd={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const index = Math.min(
              Math.max(Math.round(offsetX / SNAP_WIDTH), 0),
              books.length - 1,
            );
            selectedIndexRef.current = index;
            setSelectedIndex(index);
            onSelectedBookChangeRef.current?.(books[index] ?? null);
          }}
          scrollEventThrottle={16}
        />
      </View>

      {showSelectedInfo && selectedBook ? (
        <StaminaSelectedBookInfo book={selectedBook} />
      ) : null}
    </>
  );
}

export function StaminaSelectedBookInfo({ book }: { book: ReadingStaminaBook }) {
  return (
    <View style={styles.selectedBookInfo}>
      <Text style={styles.selectedBookTitle} numberOfLines={1} ellipsizeMode="tail">
        {book.title}
      </Text>
      <View style={styles.selectedBookAuthorRow}>
        <Ionicons name="person-outline" size={12} color="#777777" />
        <Text style={styles.selectedBookAuthor} numberOfLines={1} ellipsizeMode="tail">
          {book.author}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  carouselContent: {
    alignItems: 'center',
  },
  bookCarouselItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: ITEM_WIDTH,
    marginHorizontal: ITEM_MARGIN,
  },
  bookCarouselCover: {
    width: 100,
    height: 160,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedBookInfo: {
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: 16,
    marginTop: -4,
  },
  selectedBookTitle: {
    fontSize: 14,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: SCREEN_WIDTH - 48,
  },
  selectedBookAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: SCREEN_WIDTH - 48,
  },
  selectedBookAuthor: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: '#777777',
    textAlign: 'center',
    flexShrink: 1,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: '#777777',
    textAlign: 'center',
  },
  loadingBox: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
