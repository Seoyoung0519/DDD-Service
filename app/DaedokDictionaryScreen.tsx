/**
 * 대독사전 — 표지 → 18종 장르 스티커 → 장르 상세 모달
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GenreDetailModal } from '@/src/components/daedokDictionary/GenreDetailModal';
import { DaedokDictionaryStickerGrid } from '@/src/components/daedokDictionary/DaedokDictionaryStickerGrid';
import {
  DAEDOK_DICTIONARY_GENRES,
  type DaedokDictionaryGenre,
} from '@/src/constants/daedokDictionaryGenres';

const COVER_IMAGE = require('../assets/images/daedokDictionary/cover.png');

/** 스티커 페이지 배경 */
export const DAEDOK_DICTIONARY_BG = '#EFEBE5';
/** 겉표지 페이지 배경 */
const COVER_PAGE_BG = '#F2E7E1';

const COVER_ASPECT = 723 / 1024;

type DictionaryStep = 'cover' | 'stickers';

export default function DaedokDictionaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<DictionaryStep>('cover');
  const [selectedGenre, setSelectedGenre] = useState<DaedokDictionaryGenre | null>(null);

  if (step === 'cover') {
    return (
      <View style={styles.coverRoot}>
        <View
          style={[
            styles.coverImageWrap,
            { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 36 },
          ]}>
          <Image source={COVER_IMAGE} style={styles.coverImage} contentFit="contain" />
        </View>
        <TouchableOpacity
          style={[styles.coverBackBtn, { top: insets.top + 14 }]}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로">
          <Ionicons name="chevron-back" size={26} color="#222" />
        </TouchableOpacity>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.coverPress, { paddingBottom: insets.bottom + 40 }]}
          onPress={() => setStep('stickers')}
          accessibilityRole="button">
          <Text style={styles.coverHint}>화면을 눌러 시작하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarHomeBtn}
          onPress={() => router.replace('/DaedokPick')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="홈">
          <Ionicons name="home-outline" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>대독사전</Text>
      </View>

      <View style={styles.stickersBody}>
        <Text style={styles.guideText}>궁금한 장르 스티커를 눌러보세요</Text>
        <DaedokDictionaryStickerGrid
          genres={DAEDOK_DICTIONARY_GENRES}
          onPressGenre={setSelectedGenre}
        />
      </View>

      <GenreDetailModal
        genre={selectedGenre}
        visible={selectedGenre != null}
        onClose={() => setSelectedGenre(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  coverRoot: {
    flex: 1,
    backgroundColor: COVER_PAGE_BG,
  },
  coverImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '90%',
    aspectRatio: COVER_ASPECT,
  },
  coverPress: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  coverHint: {
    fontSize: 13,
    color: '#7A756E',
  },
  coverBackBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
    padding: 8,
  },
  root: {
    flex: 1,
    backgroundColor: DAEDOK_DICTIONARY_BG,
  },
  topBar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 8,
  },
  topBarHomeBtn: {
    position: 'absolute',
    left: 12,
    top: 24,
    zIndex: 1,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  stickersBody: {
    flex: 1,
    width: '100%',
  },
  guideText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    marginTop: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
