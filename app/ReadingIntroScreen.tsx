import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 이미지 경로
const BUS_LOGO = require('../assets/images/drawer/bus.png'); // 상단 헤더용
const BELL_ICON_HEADER = require('../assets/images/drawer/bell.png'); // 상단 헤더용
const BUS_ICON = require('../assets/images/reading_session/버스.png');
const SUBWAY_ICON = require('../assets/images/reading_session/지하철.png');
const LOCATION_ICON = require('../assets/images/reading_session/위치.png');
const BELL_ICON = require('../assets/images/reading_session/종.png');
const BOOK_ICON = require('../assets/images/reading_session/책.png');
const ARROW_ICON = require('../assets/images/reading_session/화살표.png');

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

export default function ReadingIntroScreen() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('책읽기');

  const handleStartReading = () => {
    // ReadingSession_1로 이동
    router.push('/ReadingSession_1');
  };

  // 텍스트에서 초록색으로 강조할 부분을 렌더링하는 함수
  const renderTextWithHighlight = (
    text: string,
    highlights: string[],
    highlightColor: string = COLORS.PRIMARY_GREEN,
  ) => {
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let keyIndex = 0;

    // 모든 하이라이트 위치를 찾아서 정렬
    const highlightPositions: Array<{ start: number; end: number; text: string }> = [];
    highlights.forEach((highlight) => {
      let searchIndex = 0;
      while (true) {
        const index = text.indexOf(highlight, searchIndex);
        if (index === -1) break;
        highlightPositions.push({
          start: index,
          end: index + highlight.length,
          text: highlight,
        });
        searchIndex = index + 1;
      }
    });

    // 위치 순서대로 정렬
    highlightPositions.sort((a, b) => a.start - b.start);

    // 겹치는 부분 제거 및 병합
    const mergedPositions: Array<{ start: number; end: number; text: string }> = [];
    highlightPositions.forEach((pos) => {
      if (mergedPositions.length === 0) {
        mergedPositions.push(pos);
      } else {
        const last = mergedPositions[mergedPositions.length - 1];
        if (pos.start <= last.end) {
          // 겹치는 경우 병합
          last.end = Math.max(last.end, pos.end);
          last.text = text.substring(last.start, last.end);
        } else {
          mergedPositions.push(pos);
        }
      }
    });

    // 텍스트 조각 생성
    mergedPositions.forEach((pos) => {
      // 하이라이트 전 텍스트
      if (pos.start > lastIndex) {
        parts.push(text.substring(lastIndex, pos.start));
      }
      // 하이라이트 텍스트
      parts.push(
        <Text key={`highlight-${keyIndex++}`} style={styles.highlightText}>
          {pos.text}
        </Text>,
      );
      lastIndex = pos.end;
    });

    // 나머지 텍스트
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <Text style={styles.cardDescription}>{parts}</Text>;
  };

  // 텍스트 컨테이너 컴포넌트 (위치 조정 가능)
  interface TextContainerProps {
    children: React.ReactNode;
    style?: any;
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
  }

  const CardTextContainer = ({
    children,
    style,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
  }: TextContainerProps) => {
    const containerStyle = [
      {
        alignItems: 'center' as const,
        width: '100%',
        ...(marginTop !== undefined && { marginTop }),
        ...(marginRight !== undefined && { marginRight }),
        ...(marginBottom !== undefined && { marginBottom }),
        ...(marginLeft !== undefined && { marginLeft }),
        ...(paddingTop !== undefined && { paddingTop }),
        ...(paddingRight !== undefined && { paddingRight }),
        ...(paddingBottom !== undefined && { paddingBottom }),
        ...(paddingLeft !== undefined && { paddingLeft }),
      },
      style,
    ];

    return <View style={containerStyle}>{children}</View>;
  };

  // 카드 1 제목 컴포넌트
  const Card1Title = () => (
    <CardTextContainer marginBottom={6}>
      <Text style={styles.cardTitle}>읽을 책 PICK</Text>
    </CardTextContainer>
  );

  // 카드 1 설명 컴포넌트
  const Card1Description = () => (
    <CardTextContainer>
      <Text style={styles.cardDescription}>
        대중교통을 이용할 동안 읽을 책을 골라주세요
      </Text>
    </CardTextContainer>
  );

  // 카드 2 제목 컴포넌트
  const Card2Title = () => (
    <CardTextContainer marginBottom={6}>
      <Text style={styles.cardTitle}>출·도착지 등록</Text>
    </CardTextContainer>
  );

  // 카드 2 설명 컴포넌트
  const Card2Description = () => (
    <CardTextContainer>
      <Text style={styles.cardDescription}>
        대독단이 <Text style={styles.highlightText}>이동 소요시간</Text>과 여러분의 <Text style={styles.highlightText}>책 읽는 속도</Text> 등을 고려해 <Text style={styles.highlightText}>책 쪽수</Text>를 추천해요
      </Text>
    </CardTextContainer>
  );

  // 카드 3 제목 컴포넌트
  const Card3Title = () => (
    <CardTextContainer marginBottom={6}>
      <Text style={styles.cardTitle}>기록하고 인증하기</Text>
    </CardTextContainer>
  );

  // 카드 3 설명 컴포넌트
  const Card3Description = () => (
    <CardTextContainer>
      <Text style={styles.cardDescription}>
        이동 시간동안 읽은 <Text style={styles.highlightText}>책 쪽수를</Text> <Text style={styles.highlightText}>기록하고</Text> <Text style={styles.highlightText}>커스텀 인증샷</Text>을 공유해요
      </Text>
    </CardTextContainer>
  );

  // 카드 4 제목 컴포넌트
  const Card4Title = () => (
    <CardTextContainer marginBottom={6}>
      <Text style={styles.cardTitle}>독서하기</Text>
    </CardTextContainer>
  );

  // 카드 4 설명 컴포넌트
  const Card4Description = () => (
    <CardTextContainer>
      <Text style={styles.cardDescription}>
        추천 쪽수대로 <Text style={styles.highlightText}>독서를</Text> 시작하고 <Text style={styles.highlightText}>환승할 지점</Text>과 도착지 한 정거장 전 <Text style={styles.highlightText}>독서 정리 알림</Text>을 제공해요
      </Text>
    </CardTextContainer>
  );

  // 이미지 컨테이너 컴포넌트 (위치 조정 가능)
  interface ImageContainerProps {
    children: React.ReactNode;
    style?: any;
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    gap?: number;
  }

  const CardImageContainer = ({
    children,
    style,
    top,
    right,
    bottom,
    left,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    gap = 8,
  }: ImageContainerProps) => {
    const containerStyle = [
      {
        flexDirection: 'row' as const,
        justifyContent: 'flex-end' as const,
        alignItems: 'flex-end' as const,
        gap: gap,
        width: '100%',
        marginTop: marginTop ?? 10, // 기본값 적용
        ...(top !== undefined && { top }),
        ...(right !== undefined && { right }),
        ...(bottom !== undefined && { bottom }),
        ...(left !== undefined && { left }),
        ...(marginRight !== undefined && { marginRight }),
        ...(marginBottom !== undefined && { marginBottom }),
        ...(marginLeft !== undefined && { marginLeft }),
      },
      style,
    ];

    return <View style={containerStyle}>{children}</View>;
  };

  // 카드 1 이미지 컨테이너 컴포넌트
  const Card1ImageContainer = () => (
    <CardImageContainer marginTop={12}>
      <Image source={BUS_ICON} style={styles.cardImage1_1} resizeMode="contain" />
      <Image source={SUBWAY_ICON} style={[styles.cardImage1_2, { marginLeft: -14 }]} resizeMode="contain" />
    </CardImageContainer>
  );

  // 카드 2 이미지 컨테이너 컴포넌트
  const Card2ImageContainer = () => (
    <View style={{ position: 'absolute', bottom: 4, right: 14, width: '100%', alignItems: 'flex-end' }}>
      <Image source={LOCATION_ICON} style={styles.cardImage2} resizeMode="contain" />
    </View>
  );

  // 카드 3 이미지 컨테이너 컴포넌트
  const Card3ImageContainer = () => (
    <View style={{ position: 'absolute', bottom: 4, right: 14, width: '100%', alignItems: 'flex-end' }}>
      <Image source={BOOK_ICON} style={styles.cardImage3} resizeMode="contain" />
    </View>
  );

  // 카드 4 이미지 컨테이너 컴포넌트
  const Card4ImageContainer = () => (
    <View style={{ position: 'absolute', bottom: 4, right: 14, width: '100%', alignItems: 'flex-end' }}>
      <Image source={BELL_ICON} style={styles.cardImage4} resizeMode="contain" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단 헤더 */}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 상단 타이틀 영역 */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>대독단과 </Text>
            <Text style={styles.titleTextGreen}>독서</Text>
            <Text style={styles.titleText}>하기</Text>
          </View>
        </View>

        {/* 4단계 워크플로우 (독립 위치 배치) */}
        <View style={styles.workflowContainer}>
          {/* 카드 1: 읽을 책 PICK (왼쪽 위) */}
          <View style={styles.card1}>
            <View style={styles.cardContent}>
              <Card1Title />
              <Card1Description />
            </View>
            <Card1ImageContainer />
          </View>

          {/* 화살표 1: 읽을 책 PICK → 출·도착지 등록 */}
          <View style={styles.arrow1}>
            <Image source={ARROW_ICON} style={styles.arrowImage} resizeMode="contain" />
          </View>

          {/* 카드 2: 출·도착지 등록 (오른쪽 위) */}
          <View style={styles.card2}>
            <View style={styles.cardContent}>
              <Card2Title />
              <Card2Description />
            </View>
            <Card2ImageContainer />
          </View>

          {/* 화살표 2: 출·도착지 등록 ↓ 독서하기 */}
          <View style={styles.arrow2}>
            <Image 
              source={ARROW_ICON} 
              style={[styles.arrowImage, styles.arrowRotated90]} 
              resizeMode="contain" 
            />
          </View>

          {/* 카드 4: 독서하기 (오른쪽 아래) */}
          <View style={styles.card4}>
            <View style={styles.cardContent}>
              <Card4Title />
              <Card4Description />
            </View>
            <Card4ImageContainer />
          </View>

          {/* 화살표 3: 독서하기 ← 기록하고 인증하기 */}
          <View style={styles.arrow3}>
            <Image 
              source={ARROW_ICON} 
              style={[styles.arrowImage, styles.arrowRotated180]} 
              resizeMode="contain" 
            />
          </View>

          {/* 카드 3: 기록하고 인증하기 (왼쪽 아래) */}
          <View style={styles.card3}>
            <View style={styles.cardContent}>
              <Card3Title />
              <Card3Description />
            </View>
            <Card3ImageContainer />
          </View>
        </View>

        {/* 하단 안내 문구 + 인디케이터 */}
        <View style={styles.bottomInfoSection}>
          <Text style={styles.bottomQuestion}>이제 독서를 시작해볼까요?</Text>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>
        </View>

        {/* 시작하기 버튼 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartReading}
            activeOpacity={0.7}>
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
          <Text style={[styles.navLabel, activeNav === '투데이' && styles.navLabelActive]}>
            투데이
          </Text>
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
          <Text style={[
            styles.navLabel,
            activeNav === '책읽기' && styles.navLabelActiveReading
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
          <Text style={[styles.navLabel, activeNav === '검색' && styles.navLabelActive]}>검색</Text>
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
          <Text style={[styles.navLabel, activeNav === '내서재' && styles.navLabelActive]}>
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
    position: 'relative',
    height: 400, // 전체 워크플로우 높이
    width: '100%',
  },
  card1: {
    position: 'absolute',
    left: 16,
    top: 0,
    width: (SCREEN_WIDTH - 32 - 40) / 2, // 화면 너비 - 좌우 패딩 - 화살표 공간
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    height: 180,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  card2: {
    position: 'absolute',
    right: 16,
    top: 0,
    width: (SCREEN_WIDTH - 32 - 40) / 2,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    height: 180,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  card3: {
    position: 'absolute',
    left: 16,
    bottom: 0,
    width: (SCREEN_WIDTH - 32 - 40) / 2,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    height: 180,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  card4: {
    position: 'absolute',
    right: 16,
    bottom: 0,
    width: (SCREEN_WIDTH - 32 - 40) / 2,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    height: 180,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  cardContent: {
    alignItems: 'center',
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.SUBTITLE,
    lineHeight: 18,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
  },
  highlightText: {
    color: COLORS.PRIMARY_GREEN,
    fontWeight: '600',
  },
  cardImageContainer1: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
    width: '100%',
  },
  cardImageContainer2: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
    width: '100%',
  },
  cardImageContainer3: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
    width: '100%',
  },
  cardImageContainer4: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
    width: '100%',
  },
  cardImage1_1: {
    width: 60,
    height: 60,
  },
  cardImage1_2: {
    width: 60,
    height: 60,
  },
  cardImage2: {
    width: 60,
    height: 60,
  },
  cardImage3: {
    width: 60,
    height: 60,
  },
  cardImage4: {
    width: 70,
    height: 60,
  },
  arrow1: {
    position: 'absolute',
    left: 16 + (SCREEN_WIDTH - 32 - 40) / 2 + 10, // card1 오른쪽 끝 + 간격
    top: 90 - 10, // 카드 중앙 (180 / 2) - 화살표 높이의 절반 (크기 줄임에 따라 조정)
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // 카드 위에 표시 (겹침 허용)
  },
  arrow2: {
    position: 'absolute',
    right: 16 + (SCREEN_WIDTH - 32 - 40) / 2 - 80, // card2 오른쪽 끝에서 왼쪽으로 (오른쪽으로 더 이동)
    top: 180 + 10, // card2 아래
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // 겹침 허용
  },
  arrow3: {
    position: 'absolute',
    right: 16 + (SCREEN_WIDTH - 32 - 40) / 2 + 12, // card4 오른쪽 끝에서 왼쪽으로
    bottom: 90 - 10, // 카드 중앙 (180 / 2) - 화살표 높이의 절반 (크기 줄임에 따라 조정)
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // 겹침 허용
  },
  arrowImage: {
    width: 18,
    height: 18,
  },
  arrowRotated90: {
    transform: [{ rotate: '90deg' }],
  },
  arrowRotated180: {
    transform: [{ rotate: '180deg' }],
  },
  arrowText: {
    fontSize: 24, // 화살표 크기 증가
    color: COLORS.LIGHT_GRAY,
    fontFamily: FONTS.REGULAR,
    lineHeight: 28,
    textAlign: 'center',
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
    marginTop: 24,
    alignItems: 'center',
  },
  startButton: {
    width: '80%',
    height: 52,
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
  navLabelActiveReading: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '500',
  },
});

