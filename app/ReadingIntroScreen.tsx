import { AppMenuButton } from '@/src/components/header/AppMenuButton';
import { NotificationBellButton } from '@/src/components/header/NotificationBellButton';
import { ProfileHeaderButton } from '@/src/components/header/ProfileHeaderButton';
import { AppBottomNavBar } from '@/src/components/navigation/AppBottomNavBar';
import { AppText } from '@/src/components/ui/AppText';
import { APP_FONTS } from '@/src/theme/fonts';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png'); // 상단 헤더용
const BUS_ICON = require('../assets/images/reading_session/icon-bus.png');
const SUBWAY_ICON = require('../assets/images/reading_session/icon-subway.png');
const LOCATION_ICON = require('../assets/images/reading_session/icon-location.png');
const BELL_ICON = require('../assets/images/reading_session/icon-bell.png');
const BOOK_ICON = require('../assets/images/reading_session/icon-book.png');
const ARROW_ICON = require('../assets/images/reading_session/icon-arrow.png');

// 하단 네비게이션 아이콘
const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../assets/images/drawer/drawer.png');

// 색상 상수
const COLORS = {
  PRIMARY: '#2C8C55',
  PRIMARY_GREEN: '#2C8C55',
  TEXT: '#222',
  SUBTITLE: '#7A7A7A',
  GRAY: '#999',
  LIGHT_GRAY: '#CCCCCC',
  DARK_GRAY: '#666666',
  BACKGROUND: '#FFFFFF',
  CARD_BG: '#F5F5F5', // 연한 회색 배경
  CARD_BORDER: '#EAEAEA',
  CARD_SHADOW: 'rgba(0,0,0,0.05)',
  BUTTON_GREEN: '#2C8C55',
  BUTTON_TEXT: '#FFFFFF',
  BORDER: '#EAEAEA',
};

const FONTS = APP_FONTS;

export default function ReadingIntroScreen() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('책읽기');

  const handleStartReading = () => {
    router.push('/ReadingSession_1');
  };

  const Card1Title = () => (
    <AppText weight="bold" variant="title" style={styles.cardTitle}>
      읽을 책 PICK
    </AppText>
  );

  const Card1Description = () => (
    <AppText variant="body" style={styles.cardDescription}>
      대중교통을 이용할 동안 읽을 책을 골라주세요
    </AppText>
  );

  const Card2Title = () => (
    <AppText weight="bold" variant="title" style={styles.cardTitle}>
      출·도착지 등록
    </AppText>
  );

  const Card2Description = () => (
    <AppText variant="body" style={styles.cardDescription}>
      대독단이 <AppText variant="body" style={styles.highlightText}>이동 소요시간</AppText>과 여러분의{' '}
      <AppText variant="body" style={styles.highlightText}>책 읽는 속도</AppText> 등을 고려해{' '}
      <AppText variant="body" style={styles.highlightText}>책 쪽수</AppText>를 추천해요
    </AppText>
  );

  const Card3Title = () => (
    <AppText weight="bold" variant="title" style={styles.cardTitle}>
      기록하고 인증하기
    </AppText>
  );

  const Card3Description = () => (
    <AppText variant="body" style={styles.cardDescription}>
      이동 시간동안 읽은 <AppText variant="body" style={styles.highlightText}>책 쪽수를</AppText>{' '}
      <AppText variant="body" style={styles.highlightText}>기록하고</AppText>{' '}
      <AppText variant="body" style={styles.highlightText}>커스텀 인증샷</AppText>을 공유해요
    </AppText>
  );

  const Card4Title = () => (
    <AppText weight="bold" variant="title" style={styles.cardTitle}>
      독서하기
    </AppText>
  );

  const Card4Description = () => (
    <AppText variant="body" style={styles.cardDescription}>
      추천 쪽수대로 <AppText variant="body" style={styles.highlightText}>독서를</AppText> 시작하고{' '}
      <AppText variant="body" style={styles.highlightText}>환승할 지점</AppText>과 도착지 한 정거장 전{' '}
      <AppText variant="body" style={styles.highlightText}>독서 정리 알림</AppText>을 제공해요
    </AppText>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ExpoImage source={BUS_LOGO} style={styles.logoIcon} contentFit="contain" />
          <AppText weight="bold" variant="nav" style={styles.logoText}>
            대독단
          </AppText>
        </View>
        <View style={styles.headerRight}>
          <ProfileHeaderButton style={styles.headerIconButton} iconColor={COLORS.TEXT} />
          <NotificationBellButton style={styles.headerIconButton} />
          <AppMenuButton style={styles.headerIconButton} iconColor={COLORS.TEXT} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 상단 타이틀 영역 */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <AppText weight="bold" variant="title" style={styles.titleText}>
              대독단과{' '}
            </AppText>
            <AppText weight="bold" variant="title" style={styles.titleTextGreen}>
              독서
            </AppText>
            <AppText weight="bold" variant="title" style={styles.titleText}>
              하기
            </AppText>
          </View>
        </View>

        <View style={styles.workflowContainer}>
          <View style={styles.workflowRow}>
            <View style={styles.card}>
              <View style={styles.cardTextBlock}>
                <Card1Title />
                <Card1Description />
              </View>
              <View style={styles.cardIconRow}>
                <Image
                  key="intro-bus"
                  source={BUS_ICON}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                <Image
                  key="intro-subway"
                  source={SUBWAY_ICON}
                  style={[styles.cardImage, styles.cardImageOverlap]}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={styles.arrowSlot}>
              <Image key="intro-arrow-1" source={ARROW_ICON} style={styles.arrowImage} resizeMode="contain" />
            </View>
            <View style={styles.card}>
              <View style={styles.cardTextBlock}>
                <Card2Title />
                <Card2Description />
              </View>
              <View style={styles.cardIconRow}>
                <Image
                  key="intro-location"
                  source={LOCATION_ICON}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          <View style={styles.workflowDownRow}>
            <View style={styles.cardSpacer} />
            <View style={styles.arrowSlot} />
            <View style={styles.cardSpacer}>
              <Image
                key="intro-arrow-2"
                source={ARROW_ICON}
                style={[styles.arrowImage, styles.arrowRotated90]}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.workflowRow}>
            <View style={styles.card}>
              <View style={styles.cardTextBlock}>
                <Card3Title />
                <Card3Description />
              </View>
              <View style={styles.cardIconRow}>
                <Image
                  key="intro-book"
                  source={BOOK_ICON}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={styles.arrowSlot}>
              <Image
                key="intro-arrow-3"
                source={ARROW_ICON}
                style={[styles.arrowImage, styles.arrowRotated180]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.card}>
              <View style={styles.cardTextBlock}>
                <Card4Title />
                <Card4Description />
              </View>
              <View style={styles.cardIconRow}>
                <Image
                  key="intro-bell"
                  source={BELL_ICON}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </View>

        {/* 하단 안내 문구 + 인디케이터 */}
        <View style={styles.bottomInfoSection}>
          <AppText weight="bold" variant="title" style={styles.bottomQuestion}>
            이제 독서를 시작해볼까요?
          </AppText>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>
        </View>
      </ScrollView>

      {/* 탭바 위에 고정 — 스크롤 영역과 겹치면 시작하기 터치가 먹히지 않음 */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartReading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="시작하기">
          <AppText weight="bold" variant="button" style={styles.startButtonText}>
            시작하기
          </AppText>
        </TouchableOpacity>
      </View>

      {/* 하단 네비게이션 바 */}
      <AppBottomNavBar>
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
          <AppText variant="nav" style={[styles.navLabel, activeNav === '투데이' && styles.navLabelActive]}>
            투데이
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveNav('책읽기');
          }}>
          <Image
            source={READING_ICON}
            style={[
              styles.navIcon,
              activeNav === '책읽기' && { tintColor: COLORS.PRIMARY },
            ]}
            resizeMode="contain"
          />
          <AppText
            variant="nav"
            style={[styles.navLabel, activeNav === '책읽기' && styles.navLabelActiveReading]}>
            책읽기
          </AppText>
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
          <AppText variant="nav" style={[styles.navLabel, activeNav === '검색' && styles.navLabelActive]}>
            검색
          </AppText>
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
          <AppText variant="nav" style={[styles.navLabel, activeNav === '내서재' && styles.navLabelActive]}>
            내서재
          </AppText>
        </TouchableOpacity>
      </AppBottomNavBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    minHeight: 65,
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
    color: COLORS.BACKGROUND,
    fontSize: 10,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleText: {
    fontSize: 20, // 글자 크기 약간 줄임
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  titleTextGreen: {
    fontSize: 20, // 글자 크기 약간 줄임
    fontWeight: '700',
    color: COLORS.PRIMARY_GREEN,
    fontFamily: FONTS.BOLD,
  },
  workflowContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    width: '100%',
  },
  workflowRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  workflowDownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingVertical: 6,
  },
  cardSpacer: {
    flex: 1,
    alignItems: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    overflow: 'visible',
    justifyContent: 'space-between',
    minHeight: 168,
  },
  cardTextBlock: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
  },
  cardDescription: {
    fontSize: 11,
    color: COLORS.SUBTITLE,
    lineHeight: 16,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    includeFontPadding: false,
  },
  highlightText: {
    color: COLORS.PRIMARY_GREEN,
    fontWeight: '600',
  },
  cardIconRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    width: '100%',
    minHeight: 52,
    flexShrink: 0,
    overflow: 'visible',
  },
  cardImage: {
    width: 44,
    height: 44,
  },
  cardImageOverlap: {
    marginLeft: -8,
  },
  arrowSlot: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowImage: {
    width: 16,
    height: 16,
  },
  arrowRotated90: {
    transform: [{ rotate: '90deg' }],
  },
  arrowRotated180: {
    transform: [{ rotate: '180deg' }],
  },
  bottomInfoSection: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bottomQuestion: {
    fontSize: 16,
    fontWeight: '700', // 굵게
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD, // BOLD 폰트 사용
    marginBottom: 8,
  },
  dotsContainer: {
    flexDirection: 'column', // 세로로 정렬
    gap: 6,
    marginTop: 4,
    alignItems: 'center', // 중앙 정렬
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.GRAY,
  },
  dotActive: {
    backgroundColor: COLORS.DARK_GRAY,
  },
  dotInactive: {
    backgroundColor: COLORS.GRAY,
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  startButton: {
    width: '80%',
    minHeight: 52,
    paddingVertical: 14,
    backgroundColor: COLORS.BUTTON_GREEN,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BUTTON_TEXT,
    fontFamily: FONTS.SEMIBOLD,
  },
  bottomNav: {
    flexDirection: 'row',
    minHeight: 100,
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
  navLabelActiveReading: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },
});

