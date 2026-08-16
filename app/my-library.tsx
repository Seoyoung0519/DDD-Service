/**
 * 내서재 — 서재 요약·캘린더·통계 + 프로필 조회 API 연동
 */
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNavBar } from '@/src/components/navigation/AppBottomNavBar';

import {
  calendarIndexedHasAnyReading,
  fetchLibraryCalendar,
  fetchLibraryCompletedBooks,
  fetchLibraryStats,
  fetchLibrarySummary,
  fetchLibraryWishlist,
  wishlistBookDetailRouteId,
  indexCalendarDaysByDayOfMonth,
  type CalendarDayOut,
  type CompletedBookOut,
  type LibrarySummaryOut,
  type WishBookOut,
} from '@/src/api/library';
import {
  formatOnboardedAtLabel,
  getUserProfile,
  type UserProfileResponse,
} from '@/src/api/userProfile';
import { AppMenuButton } from '@/src/components/header/AppMenuButton';
import { NotificationBellButton } from '@/src/components/header/NotificationBellButton';
import { ProfileHeaderButton } from '@/src/components/header/ProfileHeaderButton';
import { BookReviewWriteModal } from '@/src/components/review/BookReviewWriteModal';
import { SelectBookForReviewModal } from '@/src/components/review/SelectBookForReviewModal';
import { StatsCard } from '@/src/components/reading-stats/StatsCard';
import { getUserAvatarSource, isUserAvatarId } from '@/src/constants/userAvatars';
import type { CompletedBookItem } from '@/src/data/completedBooks';
import {
  EMPTY_READING_STATS,
  readingStatsOutToCardData,
  type ReadingStatsData,
} from '@/src/components/reading-stats/types';
const BUS_LOGO = require('../assets/images/drawer/bus.png');
const READING_RECORD_IMG = require('../assets/images/mylibrary/독서기록.png');

const SCREEN_W = Dimensions.get('window').width;

const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_TAB_ICON = require('../assets/images/drawer/drawer.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#7A7A7A',
  BACKGROUND: '#FFFFFF',
  BORDER: '#EAEAEA',
};

const FONTS = {
  REGULAR: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'sans-serif' }),
  BOLD: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'sans-serif' }),
};

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function buildCalendarGrid(year: number, monthIndex: number): (number | null)[] {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const pad = first.getDay();
  const total = last.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

const EMPTY_SUMMARY: LibrarySummaryOut = {
  reviewCount: 0,
  completedCount: 0,
  inProgressCount: 0,
};

export default function MyLibraryScreen() {
  const router = useRouter();
  const [calendarViewAllPressed, setCalendarViewAllPressed] = useState(false);
  const [reviewSelectModalVisible, setReviewSelectModalVisible] = useState(false);
  const [reviewWriteModalVisible, setReviewWriteModalVisible] = useState(false);
  const [reviewWriteBook, setReviewWriteBook] = useState<CompletedBookItem | null>(null);
  const [librarySummary, setLibrarySummary] = useState<LibrarySummaryOut>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [completedBooks, setCompletedBooks] = useState<CompletedBookOut[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<WishBookOut[]>([]);
  /** GET /library/calendar — 현재 월 미니 그리드용 */
  const [calendarByDay, setCalendarByDay] = useState<Record<number, CalendarDayOut>>({});
  /** 캘린더 API 실패 시 빈 목록과 구분 (실패면 ‘읽은 책 없음’ 문구 비표시) */
  const [calendarLoadFailed, setCalendarLoadFailed] = useState(false);
  /** GET /library/stats → StatsCard */
  const [readingStats, setReadingStats] = useState<ReadingStatsData>(EMPTY_READING_STATS);
  /** GET /user/profile — 상단 프로필 영역 */
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);

  /** 요약 + 완독 + 찜 + 캘린더 + 대독 통계 + 프로필 병렬 */
  const loadLibraryPageData = useCallback(async () => {
    setSummaryLoading(true);
    const now = new Date();
    const calY = now.getFullYear();
    const calM = now.getMonth() + 1;

    const [sumRes, compRes, wishRes, calRes, statsRes, profileRes] = await Promise.allSettled([
      fetchLibrarySummary(),
      fetchLibraryCompletedBooks(),
      fetchLibraryWishlist(),
      fetchLibraryCalendar(calY, calM),
      fetchLibraryStats(),
      getUserProfile(),
    ]);
    if (sumRes.status === 'fulfilled') {
      setLibrarySummary(sumRes.value);
    } else {
      console.warn('[MyLibraryScreen] 내 서재 요약 조회 실패:', sumRes.reason);
      setLibrarySummary(EMPTY_SUMMARY);
    }
    if (compRes.status === 'fulfilled') {
      setCompletedBooks(compRes.value);
    } else {
      console.warn('[MyLibraryScreen] 완독 도서 목록 조회 실패:', compRes.reason);
      setCompletedBooks([]);
    }
    if (wishRes.status === 'fulfilled') {
      setWishlistBooks(wishRes.value);
    } else {
      console.warn('[MyLibraryScreen] 찜한 도서 목록 조회 실패:', wishRes.reason);
      setWishlistBooks([]);
    }
    if (calRes.status === 'fulfilled') {
      setCalendarByDay(indexCalendarDaysByDayOfMonth(calRes.value.days));
      setCalendarLoadFailed(false);
    } else {
      if (__DEV__) {
        console.warn('[MyLibraryScreen] 독서 캘린더 조회 실패:', calRes.reason);
      }
      setCalendarByDay({});
      setCalendarLoadFailed(true);
    }
    if (statsRes.status === 'fulfilled') {
      setReadingStats(readingStatsOutToCardData(statsRes.value));
    } else {
      if (__DEV__) {
        console.warn('[MyLibraryScreen] 독서 통계 조회 실패:', statsRes.reason);
      }
      setReadingStats(EMPTY_READING_STATS);
    }
    if (profileRes.status === 'fulfilled') {
      setUserProfile(profileRes.value);
    } else {
      if (__DEV__) {
        console.warn('[MyLibraryScreen] 프로필 조회 실패:', profileRes.reason);
      }
      setUserProfile(null);
    }
    setSummaryLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        void loadLibraryPageData();
      });
      return () => {
        cancelled = true;
      };
    }, [loadLibraryPageData]),
  );

  const now = new Date();
  const calYear = now.getFullYear();
  const calMonthIndex = now.getMonth();
  const monthLabel = `${calMonthIndex + 1}월`;

  const calendarCells = useMemo(
    () => buildCalendarGrid(calYear, calMonthIndex),
    [calYear, calMonthIndex],
  );

  const calendarWeeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    let row: (number | null)[] = [];
    calendarCells.forEach((c) => {
      row.push(c);
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
    });
    if (row.length > 0) {
      while (row.length < 7) row.push(null);
      rows.push(row);
    }
    return rows;
  }, [calendarCells]);

  const profileNickname = userProfile?.nickname?.trim() || '닉네임 없음';
  const profileJoinLine = formatOnboardedAtLabel(userProfile?.onboardedAt);
  // 선택한 캐릭터(avatarId) 우선 — SNS avatarUrl보다 우선 표시
  const profileAvatarSource = useMemo(() => {
    if (isUserAvatarId(userProfile?.avatarId)) {
      return getUserAvatarSource(userProfile.avatarId);
    }
    if (userProfile?.avatarUrl?.trim()) {
      return { uri: userProfile.avatarUrl.trim() };
    }
    return getUserAvatarSource(userProfile?.avatarId);
  }, [userProfile]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단 헤더 (투데이/검색과 동일 패턴) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ExpoImage source={BUS_LOGO} style={styles.logoIcon} contentFit="contain" />
          <Text style={styles.logoText}>대독단</Text>
        </View>
        <View style={styles.headerRight}>
          <ProfileHeaderButton style={styles.headerIconButton} iconColor={COLORS.TEXT} />
          <NotificationBellButton style={styles.headerIconButton} />
          <AppMenuButton style={styles.headerIconButton} iconColor={COLORS.TEXT} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>내서재</Text>

        {/* 프로필 — GET /user/profile */}
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            <Image source={profileAvatarSource} style={styles.avatarImg} resizeMode="cover" />
          </View>
          <View style={styles.profileTextCol}>
            <Text style={styles.nickname}>{`\u201C${profileNickname}\u201D`}</Text>
            <Text style={styles.joinLine}>{profileJoinLine}</Text>
          </View>
        </View>

        {/* 요약 통계 — GET /library/summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>
              {summaryLoading ? '—' : librarySummary.reviewCount}
            </Text>
            <Text style={styles.summaryLabel}>독서 리뷰</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>
              {summaryLoading ? '—' : librarySummary.completedCount}
            </Text>
            <Text style={styles.summaryLabel}>완독 도서 수</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>
              {summaryLoading ? '—' : librarySummary.inProgressCount}
            </Text>
            <Text style={styles.summaryLabel}>진행 중 도서</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push('/MyReviewsScreen')}>
            <Text style={styles.btnPrimaryText}>내가 쓴 리뷰 보러가기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnOutline}
            activeOpacity={0.85}
            onPress={() => router.push('/BooksInProgressScreen')}>
            <Text style={styles.btnOutlineText}>진행 중인 도서 확인하기</Text>
          </TouchableOpacity>
        </View>

        {/* 찜한 도서 */}
        <View style={[styles.section, styles.sectionWishlistAfterProfile]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            activeOpacity={0.7}
            onPress={() => router.push('/WishlistBooksScreen')}>
            <Text style={styles.sectionTitle}>찜한 도서</Text>
            <Ionicons name="chevron-forward" size={22} color="#B0B0B0" />
          </TouchableOpacity>
          <Text style={styles.sectionDesc}>
            읽을 예정이거나 궁금한 책을 이전에 담아두었다면 여기서 확인해볼 수 있어요
          </Text>
          {summaryLoading && wishlistBooks.length === 0 ? (
            <View style={styles.wishlistLoadingRow}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            </View>
          ) : wishlistBooks.length === 0 ? (
            <Text style={styles.wishlistEmptyText}>찜한 도서가 없습니다.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollPad}>
              {wishlistBooks.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.bookCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/BookDetailScreen',
                      params: {
                        bookId: wishlistBookDetailRouteId(b),
                        aladinItemId: b.aladinItemId?.trim() ?? '',
                        skipRecentBook: 'true',
                        bookTitle: b.bookTitle ?? '',
                        bookAuthor: b.bookAuthor ?? '',
                      },
                    })
                  }>
                  {b.bookThumbnailUrl ? (
                    <Image source={{ uri: b.bookThumbnailUrl }} style={styles.bookCover} resizeMode="cover" />
                  ) : (
                    <View style={[styles.bookCover, styles.wishlistCoverPlaceholder]} />
                  )}
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {b.bookTitle?.trim() || '제목 없음'}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    {b.bookAuthor?.trim() || ' '}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 완독 도서 — CTA 카드 + 표지 상단 정렬 가로 스크롤 */}
        <View style={[styles.section, styles.sectionCompletedAfterWishlist, styles.sectionFlushBottom]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            activeOpacity={0.7}
            onPress={() => router.push('/CompletedBooksScreen')}>
            <Text style={styles.sectionTitle}>완독 도서</Text>
            <Ionicons name="chevron-forward" size={22} color="#B0B0B0" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.completedScrollContent}
            style={styles.completedHScroll}>
            <TouchableOpacity
              style={styles.completedHeroCard}
              activeOpacity={0.92}
              onPress={() => setReviewSelectModalVisible(true)}>
              <View style={styles.completedHeroLeft}>
                <Text style={styles.completedHeroKicker}>기록의 기쁨</Text>
                <Text style={styles.completedHeroTitle}>
                  독서 리뷰{'\n'}작성하기
                </Text>
                <View style={styles.completedHeroChevronBtn}>
                  <Ionicons name="chevron-forward" size={17} color="#9A9A9A" />
                </View>
              </View>
              <View style={styles.completedHeroImageWrap}>
                <Image
                  source={READING_RECORD_IMG}
                  style={styles.completedHeroImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            {completedBooks.map((b) => (
              <TouchableOpacity
                key={b.bookId}
                style={styles.completedBookColumn}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/BookDetailScreen',
                    params: {
                      bookId: b.bookId,
                      skipRecentBook: 'true',
                      bookTitle: b.bookTitle ?? '',
                      bookAuthor: b.bookAuthor ?? '',
                    },
                  })
                }>
                {b.bookThumbnailUrl ? (
                  <Image
                    source={{ uri: b.bookThumbnailUrl }}
                    style={styles.completedBookCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.completedBookCover, styles.completedBookCoverPlaceholder]} />
                )}
                <Text style={styles.completedBookTitle} numberOfLines={2}>
                  {b.bookTitle?.trim() || '제목 없음'}
                </Text>
                <Text style={styles.completedBookAuthor} numberOfLines={2}>
                  {b.bookAuthor?.trim() || ' '}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 세로 ScrollView 안 가로 ScrollView 때문에 margin 이 안 먹는 기기 대비: 고정 높이 공백 */}
        <View style={styles.sectionVerticalSpacer30} />

        {/* 캘린더 */}
        <View style={[styles.section, styles.sectionFlushBottom]}>
          <View style={[styles.sectionHeader, styles.calendarSectionHeader]}>
            <Text style={styles.sectionTitle}>{monthLabel} 캘린더</Text>
            <Pressable
              onPress={() => {
                setCalendarViewAllPressed(true);
                router.push('/ReadingCalendarScreen');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}>
              <Text
                style={[
                  styles.linkMuted,
                  calendarViewAllPressed && styles.linkMutedActive,
                ]}>
                전체보기
              </Text>
            </Pressable>
          </View>
          {!summaryLoading &&
          !calendarLoadFailed &&
          !calendarIndexedHasAnyReading(calendarByDay) ? (
            <Text style={styles.calendarEmptyText}>
              아직 읽은 책이 없습니다.{'\n'}
              책읽기 탭에서 독서를 시작해보세요!
            </Text>
          ) : null}
          <View style={styles.weekRow}>
            {WEEK_LABELS.map((w) => (
              <View key={w} style={styles.weekCellWrap}>
                <Text style={styles.weekCell}>{w}</Text>
              </View>
            ))}
          </View>
          {calendarWeeks.map((week, wi) => (
            <View key={wi} style={styles.calWeekRow}>
              {week.map((day, di) => {
                if (day === null) {
                  return <View key={`e-${wi}-${di}`} style={styles.calDayFlex} />;
                }
                const dayEntry = calendarByDay[day];
                const thumbUri = dayEntry?.bookThumbnailUrl?.trim();
                return (
                  <View key={`${wi}-${day}-${di}`} style={styles.calDayFlex}>
                    <View style={styles.dayCell}>
                      <Text style={styles.dayNum}>{day}</Text>
                      {thumbUri ? (
                        <ExpoImage
                          source={{ uri: thumbUri }}
                          style={styles.dayThumb}
                          contentFit="cover"
                        />
                      ) : dayEntry?.bookTitle || dayEntry?.bookId ? (
                        <View style={[styles.dayThumb, styles.dayThumbPlaceholderMuted]} />
                      ) : (
                        <View style={styles.dayThumbPlaceholder} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.sectionVerticalSpacerCalendarToStats} />

        {/* 대독 통계 — 제목·설명은 일반 섹션 간격, 카드만 statsCardWrap 으로 아래로 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitlePlain]}>대독 통계</Text>
          <Text style={[styles.sectionDesc, styles.statsSectionDesc]}>
            한 달동안 몇권의 책을 완독했는지 연속으로 대독단과 함께{'\n'}
            독서한 최대 일수를 확인해볼 수 있어요
          </Text>
          <View style={styles.statsCardWrap}>
            <StatsCard data={readingStats} />
          </View>
        </View>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <AppBottomNavBar>
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
        <TouchableOpacity style={styles.navItem} disabled>
          <Image
            source={LIBRARY_TAB_ICON}
            style={[styles.navIcon, { tintColor: COLORS.PRIMARY }]}
            resizeMode="contain"
          />
          <Text style={[styles.navLabel, styles.navLabelActive]}>내서재</Text>
        </TouchableOpacity>
      </AppBottomNavBar>

      <SelectBookForReviewModal
        visible={reviewSelectModalVisible}
        onClose={() => setReviewSelectModalVisible(false)}
        booksFromApi={completedBooks}
        onConfirm={(book) => {
          setReviewSelectModalVisible(false);
          setReviewWriteBook(book);
          setReviewWriteModalVisible(true);
        }}
      />

      <BookReviewWriteModal
        visible={reviewWriteModalVisible}
        bookId={reviewWriteBook?.id ?? null}
        bookOverride={reviewWriteBook}
        onSubmitSuccess={() => void loadLibraryPageData()}
        onClose={() => {
          setReviewWriteModalVisible(false);
          setReviewWriteBook(null);
        }}
        onPrev={() => {
          setReviewWriteModalVisible(false);
          setReviewWriteBook(null);
          setReviewSelectModalVisible(true);
        }}
      />
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
  logoIcon: { width: 34, height: 34 },
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
  bellIcon: { width: 22, height: 22 },
  badge: {
    position: 'absolute',
    top: 3,
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
    color: COLORS.BACKGROUND,
    fontSize: 10,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginTop: 18,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
    marginRight: 14,
  },
  avatarImg: { width: '100%', height: '100%' },
  profileTextCol: { flex: 1 },
  nickname: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 6,
  },
  joinLine: {
    fontSize: 13,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 8,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: {
    fontSize: 22,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.BORDER,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#222222',
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  btnOutlineText: {
    fontSize: 13,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  /** 찜한 도서 · 완독 · 캘린더 · 대독 통계 — 섹션 간 여백 */
  section: {
    marginBottom: 40,
  },
  /** 프로필(버튼) ↔ 찜한 도서 */
  sectionWishlistAfterProfile: {
    marginTop: 40,
  },
  /** 찜한 도서 ↔ 완독 도서 사이 추가 간격 */
  sectionCompletedAfterWishlist: {
    marginTop: 18,
  },
  /** 완독·캘린더: 아래 스페이서로 간격을 줄 때 본문과 겹치지 않도록 marginBottom 0 */
  sectionFlushBottom: {
    marginBottom: 32,
  },
  /** 완독 ↔ 캘린더 고정 간격 */
  sectionVerticalSpacer30: {
    height: 30,
    flexShrink: 0,
  },
  /** 캘린더 ↔ 대독 통계 제목 */
  sectionVerticalSpacerCalendarToStats: {
    height: 0,
    flexShrink: 0,
  },
  /** 통계 카드만 아래로 (제목·설명과 겹침 방지) */
  statsCardWrap: {
    marginTop: 0,
  },
  completedHScroll: {
    flexGrow: 0,
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  /** N월 캘린더 타이틀 ↔ 요일·그리드 사이 (기본 8 + 12pt) */
  calendarSectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  sectionTitlePlain: {
    marginBottom: 4,
  },
  linkMuted: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  linkMutedActive: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    lineHeight: 20,
    marginBottom: 14,
    fontFamily: FONTS.REGULAR,
  },
  /** 대독 통계 설명 — PNG용 음수 마진 제거, 제목·설명이 카드에 가려지지 않도록 */
  statsSectionDesc: {
    marginBottom: 14,
  },
  hScrollPad: {
    paddingRight: 8,
    gap: 12,
    flexDirection: 'row',
  },
  /** 완독: CTA·표지 상단(top) 기준 정렬 */
  completedScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
    gap: 14,
  },
  bookCard: {
    width: 74,
  },
  bookCover: {
    width: 74,
    height: 104,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#EEE',
  },
  bookTitle: {
    fontSize: 12,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
  },
  wishlistLoadingRow: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistEmptyText: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    paddingVertical: 20,
    textAlign: 'center',
  },
  wishlistCoverPlaceholder: {
    backgroundColor: '#D8D8D8',
  },
  /** 완독 CTA — 연회색 둥근 카드, 좌측 카피 + 우하단 독서기록 일러스트 */
  completedHeroCard: {
    width: Math.min(Math.round(SCREEN_W * 0.74), 180),
    minHeight: 176,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#EBECF0',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DCDDE2',
    paddingLeft: 16,
    paddingTop: 16,
    paddingBottom: 12,
    paddingRight: 0,
    overflow: 'visible',
  },
  completedHeroLeft: {
    flex: 1,
    alignSelf: 'flex-start',
    paddingRight: 6,
    zIndex: 1,
  },
  completedHeroKicker: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: '#7A7A7A',
    marginBottom: 10,
  },
  completedHeroTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  completedHeroChevronBtn: {
    marginTop: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E4',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  completedHeroImageWrap: {
    width: 78,
    minHeight: 48,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginLeft: -10,
    marginRight: 10,
    marginBottom: -4,
  },
  completedHeroImage: {
    width: 88,
    height: 88,
  },
  /** 완독 목록 도서 (표지·제목 왼쪽 정렬, 표지 모서리 CTA와 톤 맞춤) */
  completedBookColumn: {
    width: 82,
  },
  completedBookCover: {
    width: 82,
    height: 114,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#E8E8E8',
  },
  /** 완독 API에 표지 URL 없을 때 */
  completedBookCoverPlaceholder: {
    backgroundColor: '#D8D8D8',
  },
  completedBookTitle: {
    fontSize: 12,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    lineHeight: 16,
    marginBottom: 4,
    textAlign: 'left',
  },
  completedBookAuthor: {
    fontSize: 11,
    fontFamily: FONTS.REGULAR,
    color: '#8E8E8E',
    lineHeight: 15,
    textAlign: 'left',
  },
  calendarEmptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekCellWrap: {
    flex: 1,
    alignItems: 'center',
  },
  weekCell: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },
  calWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calDayFlex: {
    flex: 1,
    alignItems: 'center',
    minHeight: 62,
  },
  dayCell: {
    alignItems: 'center',
    marginBottom: 6,
  },
  dayNum: {
    fontSize: 11,
    color: COLORS.TEXT,
    marginBottom: 4,
    fontFamily: FONTS.REGULAR,
  },
  dayThumb: {
    width: 28,
    height: 36,
    borderRadius: 4,
  },
  dayThumbPlaceholder: {
    width: 28,
    height: 36,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  /** 썸네일 URL 없이 독서 기록만 있는 날 */
  dayThumbPlaceholderMuted: {
    backgroundColor: '#E8E8E8',
  },
  /** Drawer_1 / SearchScreen_1 과 동일한 하단 탭 바 */
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
});
