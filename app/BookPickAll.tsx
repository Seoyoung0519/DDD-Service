import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { PLAYLISTS } from '@/src/features/bookpick/playlist';

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
    <TouchableOpacity style={styles.videoRow} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.videoThumbWrap}>
        <ExpoImage source={{ uri: item.thumbnailUrl }} style={styles.videoThumb} contentFit="cover" />
        <View style={styles.durationPill}>
          <Text style={styles.durationText} numberOfLines={1}>
            {item.duration}
          </Text>
        </View>
      </View>

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

export default function BookPickAllScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ playlistId?: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<BookPickSection | null>(null);

  const initialTitle = useMemo(() => {
    const playlistId = params.playlistId;
    if (!playlistId) return '북PICK';
    return PLAYLISTS.find((p) => p.id === playlistId)?.title ?? '북PICK';
  }, [params.playlistId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const playlistId = params.playlistId;
        if (!playlistId) {
          throw new Error('playlistId가 없습니다.');
        }

        const sections = await fetchBookPickVideos();
        const found = sections.find((s) => s.playlistId === playlistId);
        if (!found) throw new Error('해당 플레이리스트를 찾을 수 없습니다.');

        if (!cancelled) setSection(found);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || '북PICK 전체 로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [params.playlistId]);

  const items = useMemo(() => section?.items ?? [], [section]);

  const handleOpenExternal = async (url: string) => {
    try {
      if (!url) return;
      await Linking.openURL(url);
    } catch (e) {
      console.error('[BookPickAll] open url failed:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{initialTitle}</Text>
        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.listBox}>
            <FlatList
              data={items}
              keyExtractor={(it) => it.videoId}
              renderItem={({ item }) => (
                <VideoRow item={item} onPress={() => handleOpenExternal(item.externalUrl)} />
              )}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/Drawer_1')}>
          <Image source={TODAY_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>투데이</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/ReadingIntroScreen')}>
          <Image source={READING_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>책읽기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/SearchScreen_1')}>
          <Image source={SEARCH_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>검색</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/my-library')}>
          <Image source={LIBRARY_ICON} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>내서재</Text>
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
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    fontWeight: '700',
    color: COLORS.TEXT,
    marginHorizontal: 8,
  },
  headerRightSpace: {
    width: 40,
    height: 40,
  },
  scroll: {
    flex: 1,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#B00020',
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
  },
  listBox: {
    padding: 16,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 14,
  },
  videoThumbWrap: {
    position: 'relative',
    width: 110,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#DDD',
    justifyContent: 'flex-end',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  durationPill: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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

