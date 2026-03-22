/**
 * 찜한 도서 — 그리드 목록 (내 서재에서 진입), GET /library/wishlist
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchLibraryWishlist, type WishBookOut } from '@/src/api/library';

/** 모달·메타 한 줄 (저자 · 찜한 날짜) */
function wishlistMetaFromApi(b: WishBookOut): string {
  const parts: string[] = [];
  if (b.bookAuthor?.trim()) parts.push(`${b.bookAuthor.trim()} 저`);
  if (b.addedAt?.trim()) {
    try {
      const d = new Date(b.addedAt);
      if (!Number.isNaN(d.getTime())) {
        parts.push(
          d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }),
        );
      }
    } catch {
      /* noop */
    }
  }
  return parts.join(' · ') || ' ';
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

const SCREEN_W = Dimensions.get('window').width;

const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_TAB_ICON = require('../assets/images/drawer/drawer.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#111111',
  SUBTITLE: '#7A7A7A',
  BACKGROUND: '#FFFFFF',
  BORDER: '#EAEAEA',
  SEARCH_BG: '#F3F4F6',
  PLACEHOLDER: '#B0B0B0',
  MODAL_OVERLAY: 'rgba(0, 0, 0, 0.45)',
  BTN_CANCEL_BG: '#CCCCCC',
  BTN_CANCEL_TEXT: '#222222',
  MODAL_SUBTITLE: '#888888',
  MODAL_META: '#888888',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

const GRID_H_PAD = 16;
const GRID_GAP = 8;
const COLS = 4;
const ITEM_W = (SCREEN_W - GRID_H_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS;
const COVER_H = Math.round(ITEM_W * 1.38);

export default function WishlistBooksScreen() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishBookOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [modalQuery, setModalQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const list = await fetchLibraryWishlist();
      setWishlistItems(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '찜한 도서를 불러오지 못했습니다.';
      setLoadError(msg);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        void load();
      });
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = wishlistItems;
    if (!q) return list;
    return list.filter((b) => {
      const title = (b.bookTitle ?? '').toLowerCase();
      const author = (b.bookAuthor ?? '').toLowerCase();
      const meta = wishlistMetaFromApi(b).toLowerCase();
      return title.includes(q) || author.includes(q) || meta.includes(q);
    });
  }, [query, wishlistItems]);

  const modalFiltered = useMemo(() => {
    const q = modalQuery.trim().toLowerCase();
    const list = wishlistItems;
    if (!q) return list;
    return list.filter((b) => {
      const title = (b.bookTitle ?? '').toLowerCase();
      const author = (b.bookAuthor ?? '').toLowerCase();
      const meta = wishlistMetaFromApi(b).toLowerCase();
      return title.includes(q) || author.includes(q) || meta.includes(q);
    });
  }, [modalQuery, wishlistItems]);

  const openEditModal = useCallback(() => {
    setModalQuery('');
    setSelectedIds(new Set());
    setEditModalVisible(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalVisible(false);
    setSelectedIds(new Set());
    setModalQuery('');
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** 로컬 목록만 갱신 (서버 DELETE API 없음 — 새로고침 시 복구될 수 있음) */
  const handleRemoveSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setWishlistItems((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    closeEditModal();
  }, [selectedIds, closeEditModal]);

  const hasDeleteSelection = selectedIds.size > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단: 뒤로 · 제목 · 편집 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>찜한 도서</Text>
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={openEditModal}>
          <Text style={styles.editBtnText}>편집</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* 정렬 */}
        <View style={styles.sortRow}>
          <TouchableOpacity style={styles.sortBtn} activeOpacity={0.7}>
            <Text style={styles.sortText}>최근본순</Text>
            <Ionicons name="swap-vertical" size={16} color={COLORS.SUBTITLE} />
          </TouchableOpacity>
        </View>

        {/* 4열 그리드 (ScrollView 안에서 FlatList 대신 행 단위 렌더) */}
        <View style={styles.gridList}>
          {loading && wishlistItems.length === 0 ? (
            <View style={styles.gridCentered}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
          ) : loadError ? (
            <Text style={styles.emptyText}>{loadError}</Text>
          ) : wishlistItems.length === 0 ? (
            <Text style={styles.emptyText}>찜한 도서가 없습니다.</Text>
          ) : (
            chunk(wishlistItems, COLS).map((row, ri) => (
              <View key={`row-${ri}`} style={styles.gridRow}>
                {row.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.bookCell}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/BookDetailScreen',
                        params: {
                          bookId: item.bookId,
                          skipRecentBook: 'true',
                          bookTitle: item.bookTitle ?? '',
                          bookAuthor: item.bookAuthor ?? '',
                        },
                      })
                    }>
                    {item.bookThumbnailUrl ? (
                      <Image source={{ uri: item.bookThumbnailUrl }} style={styles.cover} resizeMode="cover" />
                    ) : (
                      <View style={[styles.cover, styles.coverPlaceholder]} />
                    )}
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {item.bookTitle?.trim() || '제목 없음'}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      {item.bookAuthor?.trim() || ' '}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 하단 탭 — 내서재 활성 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/Drawer_1')}>
          <Image source={TODAY_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>투데이</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/ReadingIntroScreen')}>
          <Image source={READING_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>책읽기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/SearchScreen_1')}>
          <Image source={SEARCH_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>검색</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/my-library')}>
          <Image
            source={LIBRARY_TAB_ICON}
            style={[styles.navIcon, { tintColor: COLORS.PRIMARY }]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, styles.navLabelActive]}>내서재</Text>
        </TouchableOpacity>
      </View>

      {/* 찜 목록에서 빼기 — 편집 모달 */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeEditModal}>
        <Pressable style={styles.modalOverlay} onPress={closeEditModal}>
          <Pressable
            style={[styles.modalCard, styles.modalCardPosition]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>찜 목록에서 빼기</Text>
            <Text style={styles.modalSubtitle}>
              찜한 도서에서 제거할 도서를 선택하세요
            </Text>

            <View style={styles.modalSearchWrap}>
              <Ionicons
                name="search"
                size={20}
                color={COLORS.PLACEHOLDER}
                style={styles.modalSearchIcon}
              />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="검색어를 입력하세요"
                placeholderTextColor={COLORS.PLACEHOLDER}
                value={modalQuery}
                onChangeText={setModalQuery}
                returnKeyType="search"
              />
            </View>

            <ScrollView
              style={styles.modalListScroll}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {modalFiltered.length === 0 ? (
                <Text style={styles.modalEmpty}>검색 결과가 없습니다.</Text>
              ) : (
                modalFiltered.map((item, index) => {
                  const selected = selectedIds.has(item.id);
                  const isLast = index === modalFiltered.length - 1;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.modalRow,
                        selected && styles.modalRowSelected,
                        isLast && styles.modalRowLast,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => toggleSelect(item.id)}>
                      {item.bookThumbnailUrl ? (
                        <Image source={{ uri: item.bookThumbnailUrl }} style={styles.modalThumb} resizeMode="cover" />
                      ) : (
                        <View style={[styles.modalThumb, styles.coverPlaceholder]} />
                      )}
                      <View style={styles.modalRowText}>
                        <Text style={styles.modalRowTitle} numberOfLines={2}>
                          {item.bookTitle?.trim() || '제목 없음'}
                        </Text>
                        <Text style={styles.modalRowMeta} numberOfLines={1}>
                          {wishlistMetaFromApi(item)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.modalRadioOuter,
                          selected && styles.modalRadioOuterSelected,
                        ]}
                        pointerEvents="none">
                        {selected ? (
                          <View style={styles.modalRadioInner} />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                activeOpacity={0.88}
                onPress={closeEditModal}>
                <Text style={styles.modalBtnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnDelete,
                  !hasDeleteSelection && styles.modalBtnDeleteDisabled,
                ]}
                activeOpacity={hasDeleteSelection ? 0.88 : 1}
                disabled={!hasDeleteSelection}
                onPress={handleRemoveSelected}>
                <Text
                  style={[
                    styles.modalBtnDeleteText,
                    !hasDeleteSelection && styles.modalBtnDeleteTextDisabled,
                  ]}>
                  삭제
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    minHeight: 52,
  },
  topIconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  editBtn: {
    minWidth: 52,
    paddingHorizontal: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editBtnText: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: GRID_H_PAD,
    marginTop: 14,
    marginBottom: 12,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  gridList: {
    paddingHorizontal: GRID_H_PAD,
    paddingBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
    justifyContent: 'flex-start',
  },
  bookCell: {
    width: ITEM_W,
  },
  cover: {
    width: ITEM_W,
    height: COVER_H,
    borderRadius: 8,
    backgroundColor: '#EEE',
    marginBottom: 8,
  },
  coverPlaceholder: {
    backgroundColor: '#D8D8D8',
  },
  gridCentered: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 12,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 2,
    lineHeight: 16,
  },
  bookAuthor: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.SUBTITLE,
    fontSize: 14,
    marginTop: 24,
    fontFamily: FONTS.REGULAR,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 100,
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 50,
    height: 25,
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  navLabelActive: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },

  /* —— 찜 목록에서 빼기 모달 (시안) —— */
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  /** 카드를 화면 중앙보다 살짝 위로 */
  modalCardPosition: {
    marginTop: -56,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 20,
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.REGULAR,
    color: COLORS.MODAL_SUBTITLE,
    marginBottom: 18,
  },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SEARCH_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  modalSearchIcon: {
    marginRight: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  modalListScroll: {
    maxHeight: 300,
    marginBottom: 18,
  },
  modalListContent: {
    paddingBottom: 8,
    paddingTop: 2,
    flexGrow: 1,
  },
  modalEmpty: {
    textAlign: 'center',
    color: COLORS.MODAL_SUBTITLE,
    fontSize: 14,
    paddingVertical: 32,
    fontFamily: FONTS.REGULAR,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 2,
    marginBottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  modalRowLast: {
    borderBottomWidth: 0,
  },
  modalRowSelected: {
    backgroundColor: 'rgba(44, 140, 85, 0.07)',
  },
  modalThumb: {
    width: 52,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#EEE',
    marginRight: 14,
  },
  modalRowText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  modalRowTitle: {
    fontSize: 15,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 6,
    lineHeight: 20,
  },
  modalRowMeta: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.MODAL_META,
    lineHeight: 16,
  },
  /** 오른쪽 라디오 (선택 시 안쪽 초록 원) */
  modalRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C5C5C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalRadioOuterSelected: {
    borderColor: COLORS.PRIMARY,
  },
  modalRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 2,
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: COLORS.BTN_CANCEL_BG,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  modalBtnCancelText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.BTN_CANCEL_TEXT,
  },
  modalBtnDelete: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  modalBtnDeleteDisabled: {
    backgroundColor: COLORS.BTN_CANCEL_BG,
  },
  modalBtnDeleteText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalBtnDeleteTextDisabled: {
    color: COLORS.BTN_CANCEL_TEXT,
  },
});
