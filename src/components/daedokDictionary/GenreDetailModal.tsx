import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getBookDetailByTitle, type BookDetailResponse } from '@/src/api/search';
import type { DaedokDictionaryGenre } from '@/src/constants/daedokDictionaryGenres';
import { toHighResCoverUrl } from '@/src/utils/coverUrl';
import { remoteImageSource } from '@/src/utils/mediaUrl';

type GenreDetailModalProps = {
  genre: DaedokDictionaryGenre | null;
  visible: boolean;
  onClose: () => void;
};

export function GenreDetailModal({ genre, visible, onClose }: GenreDetailModalProps) {
  const router = useRouter();
  const [bookDetail, setBookDetail] = useState<BookDetailResponse | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookLoadFailed, setBookLoadFailed] = useState(false);

  useEffect(() => {
    if (!visible || !genre) {
      setBookDetail(null);
      setBookLoading(false);
      setBookLoadFailed(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setBookLoading(true);
      setBookLoadFailed(false);
      setBookDetail(null);
      try {
        const detail = await getBookDetailByTitle(genre.recommendedBookTitle);
        if (!cancelled) setBookDetail(detail);
      } catch {
        if (!cancelled) setBookLoadFailed(true);
      } finally {
        if (!cancelled) setBookLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, genre?.id, genre?.recommendedBookTitle]);

  if (!genre) return null;

  const displayTitle = bookDetail?.title ?? genre.recommendedBookTitle;
  const displayAuthors = bookDetail?.authors?.length
    ? bookDetail.authors.join(', ')
    : null;
  const coverUrl = bookDetail?.thumbnail_url?.trim()
    ? toHighResCoverUrl(bookDetail.thumbnail_url.trim())
    : null;
  const canOpenBookDetail = Boolean(bookDetail?.aladin_item_id || genre.recommendedBookTitle);

  const openBookDetail = () => {
    if (!canOpenBookDetail) return;
    onClose();
    router.push({
      pathname: '/BookDetailScreen',
      params: {
        ...(bookDetail?.aladin_item_id ? { bookId: bookDetail.aladin_item_id } : {}),
        bookTitle: displayTitle,
        skipRecentBook: 'true',
      },
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.body}>
            <Text style={styles.title}>{genre.label}</Text>
            <Text style={styles.description}>{genre.description}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>추천 도서</Text>
            <Text style={styles.sectionHint}>
              도서를 클릭하면 더 상세한 내용을 확인할 수 있어요
            </Text>
            <TouchableOpacity
              style={styles.bookRow}
              activeOpacity={bookLoading ? 1 : 0.75}
              disabled={bookLoading}
              onPress={openBookDetail}>
              <View style={styles.bookCoverWrap}>
                {bookLoading ? (
                  <ActivityIndicator size="small" color="#888888" />
                ) : coverUrl ? (
                  <Image
                    source={remoteImageSource(coverUrl)}
                    style={styles.bookCover}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.bookCoverPlaceholder} />
                )}
              </View>
              <View style={styles.bookTextCol}>
                <Text style={styles.bookTitle}>{displayTitle}</Text>
                {displayAuthors ? (
                  <Text style={styles.bookAuthors} numberOfLines={2}>
                    {displayAuthors}
                  </Text>
                ) : null}
                <Text style={styles.bookReason}>{genre.recommendedBookReason}</Text>
                {bookLoadFailed ? (
                  <Text style={styles.bookFallbackHint}>도서 정보를 불러오지 못했습니다.</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444444',
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginVertical: 18,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 18,
    color: '#777777',
    marginBottom: 12,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bookCoverWrap: {
    width: 72,
    height: 100,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    marginRight: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  bookCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E8E8',
  },
  bookTextCol: {
    flex: 1,
    minWidth: 0,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
    lineHeight: 21,
  },
  bookAuthors: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 18,
  },
  bookReason: {
    fontSize: 13,
    lineHeight: 20,
    color: '#555555',
  },
  bookFallbackHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#AA4444',
  },
  closeBtn: {
    width: '100%',
    minHeight: 56,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  closeBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
});
