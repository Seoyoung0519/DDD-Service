import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchBookPickVideos, type BookPickSection, type BookPickVideoItem } from '@/src/api/bookPick';
import BookPickPage from '@/src/features/bookpick/BookPickPage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 하단 네비게이션 아이콘
const TODAY_ICON = require('../assets/images/drawer/bus.png');
const READING_ICON = require('../assets/images/drawer/book.png');
const SEARCH_ICON = require('../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../assets/images/drawer/drawer.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222',
  SUBTITLE: '#777777',
  BACKGROUND: '#FFFFFF',
  BORDER: '#EEEEEE',
  SECTION_BG: '#FFFFFF',
};

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

function VideoRow({ item, onPress }: { item: BookPickVideoItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.videoRow} onPress={onPress} activeOpacity={0.8}>
      <ExpoImage
        source={{ uri: item.thumbnailUrl }}
        style={styles.videoThumb}
        contentFit="cover"
      />

      <View style={styles.videoRowInfo}>
        <Text style={styles.videoRowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.videoRowMeta} numberOfLines={1}>
          {item.channelName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function BookPickScreen() {
  return <BookPickPage />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
  },
  headerRightSpace: {
    width: 40,
    height: 40,
  },
  scroll: {
    flex: 1,
  },
  sectionBox: {
    backgroundColor: COLORS.BACKGROUND,
    margin: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  subSection: {
    marginBottom: 26,
  },
  subSectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#B00020',
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 14,
  },
  videoThumb: {
    width: 110,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#DDD',
  },
  videoRowInfo: {
    flex: 1,
  },
  videoRowTitle: {
    fontSize: 13,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    lineHeight: 18,
    marginBottom: 4,
  },
  videoRowMeta: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.SUBTITLE,
    lineHeight: 16,
  },
  moreButton: {
    marginTop: 12,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D6D6D6',
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  moreButtonText: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  bottomNav: {
    height: 100,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
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
});

