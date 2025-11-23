import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { searchBooks, type SearchBookItem } from '../src/api/search';
import { addBookToBookshelf, type BookshelfItem } from '../src/api/bookshelf';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  PRIMARY_GREEN: '#5AA83A',
  TEXT: '#222222',
  SUBTITLE: '#777777',
  PLACEHOLDER: '#CCCCCC',
  BACKGROUND: '#FFFFFF',
  SEARCH_BG: '#F7F7F7',
  SELECTED_BG: '#F5FBF5',
  BORDER: '#EEEEEE',
  RADIO_BORDER: '#CCCCCC',
  RADIO_SELECTED: '#48A648',
  OVERLAY: 'rgba(0,0,0,0.4)',
  ERROR: '#FF3B30',
};

// 폰트 패밀리
const FONTS = {
  REGULAR: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  MEDIUM: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'sans-serif',
  }),
  SEMIBOLD: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'sans-serif',
  }),
  BOLD: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'sans-serif',
  }),
};

interface AddToShelfModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAndAdd: (item: BookshelfItem) => void;
}

export default function AddToShelfModal({ visible, onClose, onSelectAndAdd }: AddToShelfModalProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchBookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setSearchResults([]);
      setSelectedBookId(null);
      setErrorMessage(null);
      setLoading(false);
      setIsAdding(false);
    }
  }, [visible]);

  // 검색 실행
  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await searchBooks(trimmed);
      setSearchResults(res.data.items);
      setSelectedBookId(null);
    } catch (e: any) {
      console.error('[AddToShelfModal] 검색 실패:', e);
      setErrorMessage('검색 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 검색 결과 선택
  const handleSelectResult = (item: SearchBookItem) => {
    // bookId가 있으면 bookId를, 없으면 aladin_item_id를 임시로 사용
    // 실제 추가 시에는 bookId가 필요하므로 상세 정보를 조회해야 할 수 있음
    const idToUse = item.bookId || item.aladin_item_id;
    setSelectedBookId(idToUse);
  };

  // "추가" 버튼 클릭 시 내 서재 담기 API 호출
  const handleConfirmAdd = async () => {
    if (!selectedBookId) {
      Alert.alert('도서 선택', '책을 한 권 선택해 주세요.');
      return;
    }

    // 선택된 책 찾기
    const selectedBook = searchResults.find(
      (book) => book.bookId === selectedBookId || book.aladin_item_id === selectedBookId
    );

    if (!selectedBook) {
      Alert.alert('오류', '선택된 도서 정보를 찾을 수 없습니다.');
      return;
    }

    // bookId가 없으면 aladin_item_id로 책 상세 정보를 조회해서 bookId를 얻어야 함
    let actualBookId = selectedBookId;

    if (!selectedBook.bookId) {
      try {
        // 책 상세 정보 조회 (이 API는 우리 DB의 book.id를 반환함)
        const { getBookDetail } = await import('../src/api/search');
        const detailRes = await getBookDetail(selectedBook.aladin_item_id, true);
        actualBookId = detailRes.data.id;
      } catch (err) {
        console.error('[AddToShelfModal] 책 상세 정보 조회 실패:', err);
        Alert.alert('오류', '도서 정보를 불러올 수 없습니다.');
        return;
      }
    } else {
      actualBookId = selectedBook.bookId;
    }

    try {
      setIsAdding(true);
      const res = await addBookToBookshelf(actualBookId);
      const { item, alreadyExists } = res.data;

      if (alreadyExists) {
        // 이미 내 책장에 있는 책인 경우
        Alert.alert('알림', '이미 내 책장에 담겨 있는 책이에요.');
      } else {
        // 새로 추가된 경우
        onSelectAndAdd(item);
      }

      onClose();
    } catch (e: any) {
      console.error('[AddToShelfModal] 책 추가 실패:', e);
      const errorMessage = e.response?.data?.message || e.message || '책을 내 책장에 담는 중 문제가 발생했어요.';
      Alert.alert('오류', errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      {/* 어두운 배경 오버레이 */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          {/* 모달 카드 */}
          <View style={styles.modalCard}>
            {/* 상단 텍스트 영역 */}
            <View style={styles.headerSection}>
              <Text style={styles.modalTitle}>내 책장에 담기</Text>
              <Text style={styles.modalDescription}>책장에 넣을 도서를 검색해 선택하세요.</Text>
            </View>

            {/* 검색 입력 영역 */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#B8B8B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="책 이름을 입력하세요"
                placeholderTextColor={COLORS.PLACEHOLDER}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                editable={!loading && !isAdding}
              />
              {query.trim() && (
                <TouchableOpacity onPress={handleSearch} disabled={loading || isAdding} activeOpacity={0.7}>
                  <Ionicons name="search" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              )}
            </View>

            {/* 에러 메시지 */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* 도서 리스트 영역 */}
            <ScrollView style={styles.bookListContainer} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                  <Text style={styles.loadingText}>검색 중...</Text>
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((book) => {
                  const isSelected =
                    selectedBookId === book.bookId || selectedBookId === book.aladin_item_id;
                  return (
                    <TouchableOpacity
                      key={book.aladin_item_id}
                      style={[styles.bookItem, isSelected && styles.bookItemSelected]}
                      onPress={() => handleSelectResult(book)}
                      activeOpacity={0.7}
                      disabled={isAdding}>
                      {/* 표지 이미지 */}
                      <View style={styles.bookCoverContainer}>
                        {book.cover ? (
                          <ExpoImage
                            source={{ uri: book.cover }}
                            style={styles.bookCover}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.bookCover, styles.bookCoverPlaceholder]}>
                            <Text style={styles.bookCoverPlaceholderText}>표지</Text>
                          </View>
                        )}
                      </View>

                      {/* 텍스트 영역 */}
                      <View style={styles.bookInfo}>
                        <Text style={styles.bookTitle} numberOfLines={1}>
                          {book.title}
                        </Text>
                        <Text style={styles.bookMeta} numberOfLines={1}>
                          {book.author} | {book.publisher} | {book.pubDate}
                        </Text>
                      </View>

                      {/* 라디오 버튼 */}
                      <View style={styles.radioContainer}>
                        {isSelected ? (
                          <View style={styles.radioSelected}>
                            <View style={styles.radioInner} />
                          </View>
                        ) : (
                          <View style={styles.radioUnselected} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : query.trim() ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>검색어를 입력해 책을 찾아보세요.</Text>
                </View>
              )}
            </ScrollView>

            {/* 하단 버튼 영역 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}
                disabled={isAdding}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, (isAdding || !selectedBookId) && styles.confirmButtonDisabled]}
                onPress={handleConfirmAdd}
                activeOpacity={0.7}
                disabled={isAdding || !selectedBookId}>
                {isAdding ? (
                  <ActivityIndicator size="small" color={COLORS.BACKGROUND} />
                ) : (
                  <Text style={styles.confirmButtonText}>추가</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.75,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  headerSection: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  modalDescription: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    lineHeight: 18,
  },
  searchContainer: {
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.SEARCH_BG,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.TEXT,
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    padding: 0,
  },
  errorContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.ERROR,
    textAlign: 'center',
  },
  bookListContainer: {
    marginTop: 16,
    maxHeight: SCREEN_HEIGHT * 0.35,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  bookItemSelected: {
    backgroundColor: COLORS.SELECTED_BG,
  },
  bookCoverContainer: {
    marginRight: 12,
  },
  bookCover: {
    width: 48,
    height: 64,
    borderRadius: 4,
  },
  bookCoverPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverPlaceholderText: {
    fontSize: 10,
    color: '#999',
    fontFamily: FONTS.REGULAR,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT,
    lineHeight: 20,
  },
  bookMeta: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    marginTop: 4,
    lineHeight: 16,
  },
  radioContainer: {
    marginLeft: 8,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.RADIO_BORDER,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.RADIO_SELECTED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.RADIO_SELECTED,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    height: 48,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
    color: '#555',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: FONTS.SEMIBOLD,
    fontWeight: '600',
    color: COLORS.BACKGROUND,
  },
});
