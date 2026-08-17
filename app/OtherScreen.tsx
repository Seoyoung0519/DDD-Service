import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { APP_FONTS } from '@/src/theme/fonts';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DIARY_IMAGE = require('../assets/images/daedokDictionary/diary.png');

export default function OtherScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로">
          <Ionicons name="chevron-back" size={26} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기타</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.textBlock}>
          <Text style={styles.sectionTitle}>대독사전</Text>
          <Text style={styles.sectionDescription}>
            도서 장르가 너무 다양하다고요?{'\n'}
            걱정하지말고 대독사전에서 찾아보세요!
          </Text>
        </View>

        <View style={styles.contentMain}>
          <View style={styles.diaryWrap}>
            <Image source={DIARY_IMAGE} style={styles.diaryImage} contentFit="contain" />
          </View>

          <TouchableOpacity
            style={styles.openBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/DaedokDictionaryScreen')}
            accessibilityRole="button"
            accessibilityLabel="사전 펼쳐보기">
            <Text style={styles.openBtnText}>사전 펼쳐보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  headerBackBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  textBlock: {
    marginBottom: -250,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
    fontFamily: APP_FONTS.MEDIUM,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
    fontFamily: APP_FONTS.REGULAR,
  },
  contentMain: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  diaryWrap: {
    alignItems: 'center',
    marginBottom: -24,
  },
  diaryImage: {
    width: '100%',
    maxWidth: 260,
    aspectRatio: 0.8,
    marginBottom: -24,
  },
  openBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  openBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
