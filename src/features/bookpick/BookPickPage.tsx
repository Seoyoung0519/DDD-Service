import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomNavBar } from '@/src/components/navigation/AppBottomNavBar';

import { fetchBookPickVideos } from '@/src/api/bookPick';

import { PLAYLISTS } from './playlist';
import type { BookPickSection } from './types';
import { BookPickSection as BookPickSectionView } from './BookPickSection';

const TODAY_ICON = require('../../../assets/images/drawer/bus.png');
const READING_ICON = require('../../../assets/images/drawer/book.png');
const SEARCH_ICON = require('../../../assets/images/drawer/search.png');
const LIBRARY_ICON = require('../../../assets/images/drawer/drawer.png');

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222',
  SUBTITLE: '#777777',
  BACKGROUND: '#FFFFFF',
  BORDER: '#EEEEEE',
};

export function normalizeSectionsByPlaylists(apiSections: BookPickSection[]): BookPickSection[] {
  const byId = new Map(apiSections.map((s) => [s.playlistId, s]));

  return PLAYLISTS.map((p) => {
    const found = byId.get(p.id);
    return {
      playlistId: p.id,
      title: p.title,
      items: found?.items ?? [],
    };
  });
}

export default function BookPickPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<BookPickSection[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchBookPickVideos();
        if (cancelled) return;

        const normalized = normalizeSectionsByPlaylists(res);
        setSections(normalized);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || '북PICK 로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return sections.map((s) => <BookPickSectionView key={s.playlistId} section={s} />);
  }, [loading, error, sections]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>북PICK</Text>
        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>{content}</View>
      </ScrollView>

      <AppBottomNavBar>
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
  body: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#B00020',
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
    color: COLORS.SUBTITLE,
    fontWeight: '600',
  },
});

