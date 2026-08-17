/**
 * 완독 도서 중 리뷰 작성용 책 선택 모달 (내 서재)
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_FONTS } from '@/src/theme/fonts';

import type { CompletedBookOut } from '@/src/api/library';
import {
  COMPLETED_BOOKS_GRID,
  type CompletedBookItem,
} from '@/src/data/completedBooks';

const PLACEHOLDER_COVER = require('../../../assets/images/drawer/book1.png');

const SCREEN_W = Dimensions.get('window').width;

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#111111',
  SUBTITLE: '#7A7A7A',
  BACKGROUND: '#FFFFFF',
  BORDER: '#E0E0E0',
  /** 리뷰·캘린더 모달과 동일한 반투명 검정 */
  OVERLAY: 'rgba(0, 0, 0, 0.72)',
  BTN_INACTIVE_TEXT: '#9E9E9E',
};

const FONTS = APP_FONTS;

const MODAL_SIDE = 16;
const GRID_INNER_PAD = 16;
const COLS = 3;
const COLUMN_GAP = 10;
const INNER_W = SCREEN_W - MODAL_SIDE * 2 - GRID_INNER_PAD * 2;
const ITEM_W = (INNER_W - COLUMN_GAP * (COLS - 1)) / COLS;
/** 표지 가로·세로를 몇 포인트 줄인 크기 */
const COVER_SHRINK = 8;
const COVER_W = ITEM_W - COVER_SHRINK;
const COVER_H = Math.round(COVER_W * 1.28);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function mapCompletedOutToItem(b: CompletedBookOut): CompletedBookItem {
  const title = b.bookTitle?.trim() || '제목 없음';
  const author = b.bookAuthor?.trim() || ' ';
  return {
    id: b.bookId,
    title,
    author,
    cover: b.bookThumbnailUrl ? { uri: b.bookThumbnailUrl } : PLACEHOLDER_COVER,
    bookIdForDetail: b.bookId,
  };
}

export type SelectBookForReviewModalProps = {
  visible: boolean;
  onClose: () => void;
  /** 책 선택 후 추가 — 이후 리뷰 작성 화면으로 연결 */
  onConfirm: (book: CompletedBookItem) => void;
  /**
   * 지정 시 목업 대신 사용 (GET /library/completed).
   * 빈 배열이면 완독 도서 없음 UI.
   */
  booksFromApi?: CompletedBookOut[] | null;
};

export function SelectBookForReviewModal({
  visible,
  onClose,
  onConfirm,
  booksFromApi,
}: SelectBookForReviewModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sourceList = useMemo((): CompletedBookItem[] => {
    if (booksFromApi != null) {
      return booksFromApi.map(mapCompletedOutToItem);
    }
    return COMPLETED_BOOKS_GRID;
  }, [booksFromApi]);

  useEffect(() => {
    if (!visible) {
      setSelectedId(null);
    }
  }, [visible]);

  const handleAdd = () => {
    if (!selectedId) return;
    const book = sourceList.find((b) => b.id === selectedId);
    if (book) onConfirm(book);
  };

  const toggleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
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
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>책선택</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={onClose}
                hitSlop={8}>
                <Text style={styles.btnOutlineText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnOutline,
                  styles.btnOutlineAfterClose,
                  selectedId ? styles.btnAddActive : styles.btnAddInactive,
                ]}
                onPress={handleAdd}
                disabled={!selectedId}
                hitSlop={8}>
                <Text
                  style={[
                    styles.btnOutlineText,
                    selectedId ? styles.btnAddTextActive : styles.btnAddTextMuted,
                  ]}>
                  추가
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.subtitle}>내 서재에 담긴 완독 도서를 불러옵니다.</Text>

          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={styles.gridScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator>
            {sourceList.length === 0 ? (
              <Text style={styles.emptyText}>완독한 도서가 없습니다.</Text>
            ) : (
              chunk(sourceList, COLS).map((row, ri) => (
                <View key={`row-${ri}`} style={styles.gridRow}>
                  {row.map((item, ci) => {
                    const selected = selectedId === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.bookCell,
                          ci < row.length - 1 && { marginRight: COLUMN_GAP },
                        ]}
                        activeOpacity={0.88}
                        onPress={() => toggleSelect(item.id)}>
                        <View style={styles.bookCellInner}>
                          <View
                            style={[
                              styles.coverWrap,
                              selected && styles.coverWrapSelected,
                            ]}>
                            <Image source={item.cover} style={styles.cover} resizeMode="cover" />
                          </View>
                          <Text style={styles.bookTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.bookAuthor} numberOfLines={2}>
                            {item.author}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    paddingHorizontal: MODAL_SIDE,
  },
  card: {
    maxHeight: '88%',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 16,
    paddingTop: 18,
    paddingHorizontal: GRID_INNER_PAD,
    paddingBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  btnOutlineAfterClose: {
    marginLeft: 10,
  },
  /** 추가 — 비활성(닫기와 동일 테두리·회색 글자) */
  btnAddInactive: {
    opacity: 0.55,
    borderColor: COLORS.BORDER,
  },
  /** 추가 — 책 선택 시 초록 테두리 */
  btnAddActive: {
    opacity: 1,
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.BACKGROUND,
  },
  btnOutlineText: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT,
  },
  btnAddTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  btnAddTextMuted: {
    color: COLORS.BTN_INACTIVE_TEXT,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginBottom: 18,
    lineHeight: 19,
  },
  gridScroll: {
    maxHeight: 420,
  },
  gridScrollContent: {
    paddingBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: COLUMN_GAP,
    justifyContent: 'flex-start',
  },
  bookCell: {
    width: ITEM_W,
  },
  bookCellInner: {
    width: '100%',
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 10,
  },
  coverWrap: {
    width: COVER_W,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coverWrapSelected: {
    borderColor: COLORS.PRIMARY,
  },
  cover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  bookTitle: {
    fontSize: 12,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT,
    lineHeight: 15,
    marginTop: 0,
    marginBottom: 1,
  },
  bookAuthor: {
    fontSize: 10,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 13,
    marginTop: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.SUBTITLE,
    paddingVertical: 24,
    fontSize: 14,
  },
});
