import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SERVICE_INTRO_SLIDES, type ServiceIntroSlide } from './serviceIntroSlides';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LOGIN_ROUTE = '/login';

const COLORS = {
  background: '#E8F3ED',
  progressTrack: '#C9D9CF',
  progressFill: '#3D5C4A',
  title: '#1A1A1A',
  description: '#5C6B62',
  mockupBg: '#FFFFFF',
  close: '#4A5D52',
};

type ServiceIntroScreenProps = {
  /** settings에서 진입 시 닫기/완료하면 이전 화면으로 복귀 */
  exitMode?: 'login' | 'back';
};

export function ServiceIntroScreen({ exitMode = 'login' }: ServiceIntroScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ServiceIntroSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollOffsetX, setScrollOffsetX] = useState(0);
  const hasNavigatedRef = useRef(false);

  const totalSlides = SERVICE_INTRO_SLIDES.length;
  const maxOffset = SCREEN_W * (totalSlides - 1);
  const progress = Math.min((scrollOffsetX + SCREEN_W) / (SCREEN_W * totalSlides), 1);

  const goToLogin = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    if (exitMode === 'back') {
      router.back();
      return;
    }
    router.replace(LOGIN_ROUTE);
  }, [router, exitMode]);

  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === totalSlides - 1;

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setScrollOffsetX(offsetX);
    const nextIndex = Math.round(offsetX / SCREEN_W);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), totalSlides - 1));
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setScrollOffsetX(Math.min(Math.max(offsetX, 0), maxOffset));
  };

  const renderSlide = ({ item }: { item: ServiceIntroSlide }) => {
    const resizeMode = item.mockupResizeMode ?? 'cover';
    const showFullImage = resizeMode === 'contain';
    const asset = showFullImage ? Image.resolveAssetSource(item.image) : null;
    const naturalAspect =
      asset?.width && asset?.height ? asset.width / asset.height : 9 / 19.5;

    let containMockupSize: { width: number; height: number } | null = null;
    if (showFullImage) {
      const widthRatio = item.mockupWidthRatio ?? 0.72;
      const maxHeightRatio = item.mockupMaxHeightRatio ?? 0.48;
      let width = SCREEN_W * widthRatio;
      let height = width / naturalAspect;
      const maxHeight = SCREEN_H * maxHeightRatio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * naturalAspect;
      }
      containMockupSize = { width, height };
    }

    return (
      <View style={[styles.slide, { width: SCREEN_W }]}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.mockupArea}>
          {showFullImage && containMockupSize ? (
            <View
              style={[
                styles.containMockup,
                {
                  width: containMockupSize.width,
                  height: containMockupSize.height,
                },
              ]}>
              <Image source={item.image} style={styles.containMockupImage} resizeMode="contain" />
            </View>
          ) : (
            <View
              style={[
                styles.mockupWrap,
                item.mockupHorizontalInset != null && {
                  marginHorizontal: item.mockupHorizontalInset,
                },
                item.mockupBottomInset != null && {
                  marginBottom: item.mockupBottomInset,
                },
                item.mockupHeightRatio != null && {
                  flex: 0,
                  height: SCREEN_H * item.mockupHeightRatio,
                },
              ]}>
              <Image source={item.image} style={styles.mockupImage} resizeMode="cover" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.topBarAction}>
          {isFirstSlide ? (
            <Pressable
              style={styles.topBarButton}
              onPress={goToLogin}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={exitMode === 'back' ? '서비스 소개 닫기' : '소개 건너뛰기'}>
              <Ionicons name="close" size={26} color={COLORS.close} />
            </Pressable>
          ) : isLastSlide ? (
            <Pressable
              style={styles.topBarButton}
              onPress={goToLogin}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={exitMode === 'back' ? '서비스 소개 닫기' : '로그인으로 이동'}>
              <Ionicons name="arrow-forward" size={26} color={COLORS.close} />
            </Pressable>
          ) : (
            <View style={styles.topBarButtonPlaceholder} />
          )}
        </View>
      </View>

      <FlatList
        key={`intro-slides-v${SERVICE_INTRO_SLIDES.length}-w${SERVICE_INTRO_SLIDES[0]?.mockupWidthRatio ?? 1}`}
        ref={listRef}
        data={SERVICE_INTRO_SLIDES}
        extraData={activeIndex}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.progressFill,
  },
  topBarAction: {
    alignItems: 'flex-end',
    minHeight: 34,
    justifyContent: 'center',
  },
  topBarButton: {
    padding: 4,
  },
  topBarButtonPlaceholder: {
    width: 34,
    height: 34,
  },
  slide: {
    flex: 1,
  },
  textBlock: {
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.title,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.description,
    textAlign: 'center',
    maxWidth: 320,
  },
  mockupArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 12,
  },
  containMockup: {
    overflow: 'hidden',
  },
  containMockupImage: {
    width: '100%',
    height: '100%',
  },
  mockupWrap: {
    flex: 1,
    position: 'relative',
    alignSelf: 'stretch',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: COLORS.mockupBg,
    overflow: 'hidden',
  },
  mockupImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
});
