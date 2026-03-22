import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCommuteRoutes } from '@/src/api/commuteRoutes';
import {
  fetchRecentCommuteRoutes,
  saveRecentCommuteRoute,
  type RecentCommuteRoute,
} from '@/src/api/commuteRecentRoutes';
import { searchCommutePlaces } from '@/src/api/commutePlaces';
import { getIdsFromSelectedBook } from '@/src/api/readingSession';
import { CommutePlaceSearchDualCard } from '@/src/components/commute/CommutePlaceSearchDualCard';
import { FALLBACK_COMMUTE_ROUTE_JSON } from '@/src/constants/fallbackCommuteRoute';
import { consumeCommutePlaceSelection } from '@/src/state/commutePlaceSelection';
import {
  setCommuteRouteResult,
  type CommuteSessionDraft,
} from '@/src/state/commuteRouteResult';
import type { CommutePlace } from '@/src/types/commute';
import { fetchCurrentUser } from '@/src/services/auth/authService';
import { pickPlaceForRecentRoute } from '@/src/utils/commutePlaceResolve';
import { extractCommuteEndpointCoordsFromRoute } from '@/src/utils/commuteRouteEndpoints';
import type { CurrentReadingItem, BookshelfItem } from '@/src/types/reading';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const BELL_ICON_HEADER = require('../assets/images/drawer/bell.png');
const LOCATION_ICON = require('../assets/images/reading_session/위치_2.png');

// 하단 네비게이션 아이콘
const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../assets/images/drawer/drawer.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  PRIMARY_GREEN: '#4CAF50',
  TEXT: '#222',
  SUBTITLE: '#7A7A7A',
  BACKGROUND: '#FFFFFF',
  CARD_BG: '#F5F5F5',
  BORDER: '#EAEAEA',
  GRAY: '#999',
  LIGHT_GRAY: '#CCCCCC',
  BUTTON_GREEN: '#4CAF50',
  BUTTON_TEXT: '#FFFFFF',
  MODAL_OVERLAY: 'rgba(0, 0, 0, 0.7)',
  MODAL_BG: '#FFFFFF',
  BUTTON_BORDER: '#000000',
  BUTTON_DISABLED: '#E0E0E0',
  BUTTON_DISABLED_TEXT: '#999999',
  INPUT_BORDER: '#EAEAEA',
  INPUT_PLACEHOLDER: '#999999',
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

export default function ReadingSession_4() {
  const { height: windowHeight } = useWindowDimensions();
  /** 모달 헤더·패딩 제외 본문 스크롤 영역 — 자동완성이 길어지면 스크롤 */
  const modalFormScrollMaxHeight = Math.round(windowHeight * 0.52);

  const router = useRouter();
  const params = useLocalSearchParams<{
    selectedBook?: string;
    /** RS2/RS3 중 어디서 왔는지 — replace 스택에서 '이전' 복귀용 */
    bookPickSource?: string;
  }>();
  const [activeNav, setActiveNav] = useState('책읽기');
  const [modalVisible, setModalVisible] = useState(true);
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  /** 검색 API로 선택된 placeId — 세션 시작 시 사용 */
  const [originPlaceId, setOriginPlaceId] = useState<string | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(null);
  /** 장소 검색 결과 좌표 — 읽기 세션 DB(origin_lat 등) 저장용 */
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  /** 전체 검색에서 장소 선택 후 복귀 시 인라인 자동완성 드롭다운 비활성화 */
  const [suppressInlineSuggestions, setSuppressInlineSuggestions] = useState(false);

  const [recentRoutes, setRecentRoutes] = useState<RecentCommuteRoute[]>([]);
  const [recentRoutesLoading, setRecentRoutesLoading] = useState(false);
  const [resolvingRecentRoute, setResolvingRecentRoute] = useState(false);

  const loadRecentRoutes = useCallback(async () => {
    setRecentRoutesLoading(true);
    try {
      const list = await fetchRecentCommuteRoutes();
      setRecentRoutes(list);
    } catch (e) {
      console.warn('[ReadingSession_4] 최근 경로 조회 실패:', e);
      setRecentRoutes([]);
    } finally {
      setRecentRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!modalVisible) return;
    void loadRecentRoutes();
  }, [modalVisible, loadRecentRoutes]);

  /** 출발·도착 텍스트 + 검색으로 확정된 placeId — 길찾기 가능 */
  const canFindRoute = useMemo(() => {
    const dep = departure.trim();
    const arr = arrival.trim();
    if (!dep || !arr) return false;
    if (resolvingRecentRoute) return false;
    return Boolean(originPlaceId && destinationPlaceId);
  }, [departure, arrival, originPlaceId, destinationPlaceId, resolvingRecentRoute]);

  /** 장소 검색 화면에서 선택 후 복귀 시 반영 */
  useFocusEffect(
    useCallback(() => {
      const picked = consumeCommutePlaceSelection();
      if (!picked) return;
      setSuppressInlineSuggestions(true);
      if (picked.field === 'origin') {
        setDeparture(picked.place.label);
        setOriginPlaceId(picked.place.placeId);
        const plat = picked.place.lat;
        const plng = picked.place.lng;
        setOriginLat(plat != null && Number.isFinite(plat) ? plat : null);
        setOriginLng(plng != null && Number.isFinite(plng) ? plng : null);
      } else {
        setArrival(picked.place.label);
        setDestinationPlaceId(picked.place.placeId);
        const plat = picked.place.lat;
        const plng = picked.place.lng;
        setDestinationLat(plat != null && Number.isFinite(plat) ? plat : null);
        setDestinationLng(plng != null && Number.isFinite(plng) ? plng : null);
      }
      void loadRecentRoutes();
    }, [loadRecentRoutes]),
  );

  /** RS4는 replace로 열려 스택에 RS2/RS3가 없음 — 이전 화면으로는 replace로만 복귀 */
  const navigateBackToBookPick = useCallback(() => {
    setModalVisible(false);
    const selectedBook = params.selectedBook;
    const source = params.bookPickSource;
    const backParams = selectedBook ? { selectedBook } : {};
    if (source === 'ReadingSession_3') {
      router.replace({ pathname: '/ReadingSession_3', params: backParams });
    } else {
      router.replace({ pathname: '/ReadingSession_2', params: backParams });
    }
  }, [params.selectedBook, params.bookPickSource, router]);

  /** 안드로이드 하드웨어 뒤로가기: 스택이 RS1→RS4일 때 RS1으로 가지 않고 책 고르기로 */
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigateBackToBookPick();
        return true;
      });
      return () => sub.remove();
    }, [navigateBackToBookPick]),
  );

  const handleClose = () => {
    navigateBackToBookPick();
  };

  const handleNext = async () => {
    if (!departure.trim() || !arrival.trim()) {
      return;
    }

    if (isStartingSession) return;

    const resolvedOrigin = originPlaceId;
    const resolvedDestination = destinationPlaceId;

    if (!resolvedOrigin || !resolvedDestination) {
      Alert.alert(
        '장소 선택',
        '출발지·도착지를 검색에서 선택해 주세요. (최근 검색을 누르면 자동 선택됩니다.)',
      );
      return;
    }

    let selectedBook: CurrentReadingItem | BookshelfItem | null = null;
    if (params.selectedBook) {
      try {
        selectedBook = JSON.parse(params.selectedBook) as
          | CurrentReadingItem
          | BookshelfItem;
      } catch {
        // 파싱 실패 시
      }
    }

    if (!selectedBook) {
      Alert.alert('알림', '먼저 읽을 책을 선택해 주세요.');
      return;
    }

    const buildSessionDraft = (user: { id: string }): CommuteSessionDraft => {
      const { userBookId, bookId } = getIdsFromSelectedBook(selectedBook!);
      const startPage = selectedBook!.currentPage ?? 1;
      const endPage = selectedBook!.pageCount ?? selectedBook!.currentPage ?? 1;
      const plannedPages = Math.max(endPage - startPage + 1, 1);
      return {
        userId: user.id,
        userBookId,
        bookId,
        startPage,
        endPage,
        plannedPages,
      };
    };

    const pushFallbackRouteResult = (
      errorMessage: string,
      user: { id: string } | null,
    ) => {
      const short =
        errorMessage.length > 320
          ? `${errorMessage.slice(0, 320)}…`
          : errorMessage;
      const sessionDraft = user ? buildSessionDraft(user) : null;
      setCommuteRouteResult({
        departureLabel: departure.trim(),
        arrivalLabel: arrival.trim(),
        originPlaceId: resolvedOrigin,
        destinationPlaceId: resolvedDestination,
        originLat: originLat ?? undefined,
        originLng: originLng ?? undefined,
        destinationLat: destinationLat ?? undefined,
        destinationLng: destinationLng ?? undefined,
        routes: [FALLBACK_COMMUTE_ROUTE_JSON],
        selectedRouteId: FALLBACK_COMMUTE_ROUTE_JSON.id,
        sessionDraft,
        warningMessage:
          '통근 경로 조회에 실패해 예시 경로만 표시합니다.\n\n' + short,
        isFallback: true,
      });
      router.push('/CommuteRouteResultScreen');
    };

    let user: { id: string } | null = null;

    try {
      setIsStartingSession(true);

      user = await fetchCurrentUser();
      const sessionDraft = buildSessionDraft(user);

      const routes = await fetchCommuteRoutes({
        originPlaceId: resolvedOrigin,
        destinationPlaceId: resolvedDestination,
        originLat,
        originLng,
        destinationLat,
        destinationLng,
      });

      /**
       * POST /api/commute/recent-routes — 서버 recent_routes 반영.
       * POST /api/commute/routes 만으로는 저장 안 됨(백엔드 스펙).
       * 장소 좌표가 없으면 경로 첫 구간 정류장 좌표로 보강.
       */
      const fb = routes[0]
        ? extractCommuteEndpointCoordsFromRoute(routes[0])
        : null;
      const saveOLat =
        originLat != null && Number.isFinite(originLat) ? originLat : fb?.originLat ?? null;
      const saveOLng =
        originLng != null && Number.isFinite(originLng) ? originLng : fb?.originLng ?? null;
      const saveDLat =
        destinationLat != null && Number.isFinite(destinationLat)
          ? destinationLat
          : fb?.destinationLat ?? null;
      const saveDLng =
        destinationLng != null && Number.isFinite(destinationLng)
          ? destinationLng
          : fb?.destinationLng ?? null;
      if (
        saveOLat != null &&
        saveOLng != null &&
        saveDLat != null &&
        saveDLng != null
      ) {
        void saveRecentCommuteRoute({
          originName: departure.trim(),
          destinationName: arrival.trim(),
          originLat: saveOLat,
          originLng: saveOLng,
          destinationLat: saveDLat,
          destinationLng: saveDLng,
        }).catch((e) => {
          if (__DEV__) {
            console.warn('[ReadingSession_4] 최근 경로 저장 실패:', e);
          }
        });
      }

      setCommuteRouteResult({
        departureLabel: departure.trim(),
        arrivalLabel: arrival.trim(),
        originPlaceId: resolvedOrigin,
        destinationPlaceId: resolvedDestination,
        originLat: originLat ?? undefined,
        originLng: originLng ?? undefined,
        destinationLat: destinationLat ?? undefined,
        destinationLng: destinationLng ?? undefined,
        routes,
        selectedRouteId: routes[0].id,
        sessionDraft,
      });
      router.push('/CommuteRouteResultScreen');
    } catch (error: any) {
      console.error('[ReadingSession_4] 통근 경로 조회 실패:', error);
      const msg =
        typeof error?.message === 'string'
          ? error.message
          : String(error ?? '알 수 없는 오류');
      pushFallbackRouteResult(msg, user);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleSelectRecentRoute = useCallback(
    async (route: RecentCommuteRoute) => {
      setSuppressInlineSuggestions(false);
      setDeparture(route.originName);
      setArrival(route.destinationName);
      setOriginPlaceId(null);
      setDestinationPlaceId(null);
      setOriginLat(null);
      setOriginLng(null);
      setDestinationLat(null);
      setDestinationLng(null);
      setResolvingRecentRoute(true);
      try {
        const [originPlaces, destPlaces] = await Promise.all([
          searchCommutePlaces(route.originName, { size: 10 }),
          searchCommutePlaces(route.destinationName, { size: 10 }),
        ]);
        const oPick = pickPlaceForRecentRoute(originPlaces, route.originLat, route.originLng);
        const dPick = pickPlaceForRecentRoute(
          destPlaces,
          route.destinationLat,
          route.destinationLng,
        );
        if (oPick) {
          setOriginPlaceId(oPick.placeId);
          const olat = oPick.lat ?? route.originLat;
          const olng = oPick.lng ?? route.originLng;
          setOriginLat(olat != null && Number.isFinite(olat) ? olat : null);
          setOriginLng(olng != null && Number.isFinite(olng) ? olng : null);
        }
        if (dPick) {
          setDestinationPlaceId(dPick.placeId);
          const dlat = dPick.lat ?? route.destinationLat;
          const dlng = dPick.lng ?? route.destinationLng;
          setDestinationLat(dlat != null && Number.isFinite(dlat) ? dlat : null);
          setDestinationLng(dlng != null && Number.isFinite(dlng) ? dlng : null);
        }
      } catch (e) {
        console.warn('[ReadingSession_4] 최근 경로 → placeId 매칭 실패:', e);
      } finally {
        setResolvingRecentRoute(false);
      }
    },
    [],
  );

  const onSelectOrigin = useCallback((place: CommutePlace) => {
    setDeparture(place.label);
    setOriginPlaceId(place.placeId);
    const plat = place.lat;
    const plng = place.lng;
    setOriginLat(plat != null && Number.isFinite(plat) ? plat : null);
    setOriginLng(plng != null && Number.isFinite(plng) ? plng : null);
    setSuppressInlineSuggestions(false);
  }, []);

  const onSelectDestination = useCallback((place: CommutePlace) => {
    setArrival(place.label);
    setDestinationPlaceId(place.placeId);
    const plat = place.lat;
    const plng = place.lng;
    setDestinationLat(plat != null && Number.isFinite(plat) ? plat : null);
    setDestinationLng(plng != null && Number.isFinite(plng) ? plng : null);
    setSuppressInlineSuggestions(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 헤더 - 읽을 책 PICK 화면과 동일 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ExpoImage source={BUS_LOGO} style={styles.logoIcon} contentFit="contain" />
          <Text style={styles.logoText}>대독단</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.TEXT} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <ExpoImage source={BELL_ICON_HEADER} style={styles.bellIcon} contentFit="contain" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>0</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="menu" size={24} color={COLORS.TEXT} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 메인 컨텐츠 - 읽을 책 PICK과 동일한 타이틀 */}
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>대독단과 </Text>
            <Text style={styles.titleTextGreen}>독서</Text>
            <Text style={styles.titleText}>하기</Text>
          </View>
        </View>
      </View>

      {/* 모달: 출·도착지 등록 — 길찾기 성공 시 CommuteRouteResultScreen으로 이동 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>출·도착지 등록</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}>
                  <Text style={styles.closeButtonText}>이전</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    (!canFindRoute || isStartingSession) && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!canFindRoute || isStartingSession}
                  activeOpacity={0.7}>
                  {isStartingSession ? (
                    <ActivityIndicator size="small" color={COLORS.BUTTON_TEXT} />
                  ) : (
                    <Text
                      style={[
                        styles.nextButtonText,
                        !canFindRoute && styles.nextButtonTextDisabled,
                      ]}>
                      길찾기
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
                style={[styles.modalFormScroll, { maxHeight: modalFormScrollMaxHeight }]}
                contentContainerStyle={styles.modalFormScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                {/* 출·도착지 — 통합 카드 UI + 자동완성(최대 4, 높이는 후보 수에 맞게 증가) */}
                <View style={styles.placeFields}>
                  <CommutePlaceSearchDualCard
                    departure={departure}
                    arrival={arrival}
                    suppressInlineSuggestions={suppressInlineSuggestions}
                    onChangeDeparture={(t) => {
                      setSuppressInlineSuggestions(false);
                      setDeparture(t);
                      setOriginPlaceId(null);
                      setOriginLat(null);
                      setOriginLng(null);
                    }}
                    onChangeArrival={(t) => {
                      setSuppressInlineSuggestions(false);
                      setArrival(t);
                      setDestinationPlaceId(null);
                      setDestinationLat(null);
                      setDestinationLng(null);
                    }}
                    onSelectOrigin={onSelectOrigin}
                    onSelectDestination={onSelectDestination}
                  />
                </View>

                <Text style={styles.recentSearchTitle}>최근 검색</Text>
                <View style={styles.recentSearchDivider} />
                {recentRoutesLoading ? (
                  <View style={styles.recentSearchLoading}>
                    <ActivityIndicator size="small" color={COLORS.PRIMARY_GREEN} />
                    <Text style={styles.recentSearchHint}>최근 경로 불러오는 중…</Text>
                  </View>
                ) : recentRoutes.length === 0 ? (
                  <Text style={styles.recentSearchEmpty}>최근 검색한 경로가 없습니다.</Text>
                ) : (
                  <View style={styles.recentSearchList}>
                    {recentRoutes.map((route) => (
                      <TouchableOpacity
                        key={route.id}
                        style={styles.recentSearchItem}
                        onPress={() => void handleSelectRecentRoute(route)}
                        disabled={resolvingRecentRoute}
                        activeOpacity={0.7}>
                        <Image
                          source={LOCATION_ICON}
                          style={styles.locationIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.recentSearchText} numberOfLines={2}>
                          {route.originName} → {route.destinationName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 하단 네비게이션 바 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('투데이');
            router.push('/Drawer_1');
          }}>
          <Image
            source={TODAY_ICON}
            style={[
              styles.navIcon,
              activeNav === '투데이' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === '투데이' && styles.navLabelActive,
            ]}>
            투데이
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('책읽기');
            // 현재 페이지이므로 이동하지 않음
          }}>
          <Image
            source={READING_ICON}
            style={[
              styles.navIcon,
              activeNav === '책읽기' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === '책읽기' && styles.navLabelActive,
            ]}>
            책읽기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('검색');
            router.push('/SearchScreen_1');
          }}>
          <Image
            source={SEARCH_ICON}
            style={[
              styles.navIcon,
              activeNav === '검색' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === '검색' && styles.navLabelActive,
            ]}>
            검색
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('내서재');
            router.push('/my-library');
          }}>
          <Image
            source={LIBRARY_ICON}
            style={[
              styles.navIcon,
              activeNav === '내서재' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.navLabel,
              activeNav === '내서재' && styles.navLabelActive,
            ]}>
            내서재
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logoIcon: {
    width: 34,
    height: 34,
  },
  logoText: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellIcon: {
    width: 22,
    height: 22,
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: -5,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 23,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.BUTTON_TEXT,
    fontSize: 10,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  titleSection: {
    paddingHorizontal: 0,
    paddingTop: 0,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  titleTextGreen: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.PRIMARY_GREEN,
    fontFamily: FONTS.BOLD,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.MODAL_BG,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 500,
    padding: 24,
    maxHeight: '80%',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    flex: 1,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BUTTON_BORDER,
    backgroundColor: COLORS.BACKGROUND,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  nextButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.BUTTON_DISABLED,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.BUTTON_TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  nextButtonTextDisabled: {
    color: COLORS.BUTTON_DISABLED_TEXT,
  },
  modalFormScroll: {
    flexGrow: 0,
  },
  modalFormScrollContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  placeFields: {
    marginBottom: 20,
    overflow: 'visible',
  },
  inputContainer: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.INPUT_BORDER,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
    overflow: 'hidden',
  },
  inputTop: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
    backgroundColor: COLORS.BACKGROUND,
  },
  inputDivider: {
    height: 1,
    backgroundColor: COLORS.INPUT_BORDER,
    width: '100%',
  },
  inputBottom: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT,
    backgroundColor: COLORS.BACKGROUND,
  },
  recentSearchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    marginBottom: 12,
  },
  recentSearchDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    width: '100%',
    marginBottom: 12,
  },
  recentSearchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  recentSearchHint: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  recentSearchEmpty: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    paddingVertical: 12,
  },
  recentSearchList: {
    gap: 8,
    paddingBottom: 4,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  locationIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.SUBTITLE,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT,
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
    tintColor: COLORS.GRAY,
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
});

