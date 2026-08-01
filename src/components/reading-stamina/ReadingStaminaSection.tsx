import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  ReadingStaminaCarousel,
  StaminaSelectedBookInfo,
} from '@/src/components/reading-stamina/ReadingStaminaCarousel';
import { ReadingStaminaRangeChips } from '@/src/components/reading-stamina/ReadingStaminaRangeChips';
import {
  getRangeDescription,
  staminaDetailRouteId,
  type ReadingStaminaBook,
} from '@/src/components/reading-stamina/types';
import { useReadingStaminaBooks, STAMINA_CAROUSEL_FETCH_LIMIT } from '@/src/components/reading-stamina/useReadingStaminaBooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

export function ReadingStaminaSection() {
  const router = useRouter();
  const { range, setRange, topFive, loading } = useReadingStaminaBooks('100', {
    limit: STAMINA_CAROUSEL_FETCH_LIMIT,
  });
  const [selectedBook, setSelectedBook] = useState<ReadingStaminaBook | null>(null);

  const openBookDetail = useCallback(
    (book: ReadingStaminaBook) => {
      router.push({
        pathname: '/BookDetailScreen',
        params: {
          bookId: staminaDetailRouteId(book),
          title: book.title,
          aladinItemId: book.aladinItemId ?? '',
        },
      });
    },
    [router],
  );

  return (
    <View style={styles.readingStaminaSection}>
      <View style={styles.staminaHeader}>
        <View style={styles.staminaHeaderLeft}>
          <Text style={styles.staminaTitle}>오늘의 독서 체력은 몇 쪽?</Text>
          <Text style={styles.staminaSubtitle}>
            대독단만의 쪽수 기준 도서 추천으로 완독률을 높여보세요.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push(`/ReadingStaminaScreen?range=${range}` as Href)
          }
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={20} color="#7A7A7A" />
        </TouchableOpacity>
      </View>

      <ReadingStaminaRangeChips selectedRange={range} onSelectRange={setRange} variant="pill" />

      <View style={styles.descriptionAndCarouselWrapper}>
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{getRangeDescription(range)}</Text>
        </View>
        <ReadingStaminaCarousel
          books={topFive}
          loading={loading}
          showSelectedInfo={false}
          onSelectedBookChange={setSelectedBook}
          onBookPress={openBookDetail}
        />
      </View>

      {selectedBook ? <StaminaSelectedBookInfo book={selectedBook} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  readingStaminaSection: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 45,
  },
  staminaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  staminaHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  staminaTitle: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
    lineHeight: 28,
  },
  staminaSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: '#777777',
    lineHeight: 20,
  },
  descriptionAndCarouselWrapper: {
    backgroundColor: '#F3F8E8',
    borderRadius: 5,
    paddingTop: 8,
    paddingBottom: 0,
    marginTop: 4,
    marginBottom: 16,
    marginHorizontal: -20,
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  descriptionBox: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: '#222222',
    lineHeight: 20,
    textAlign: 'center',
  },
});
