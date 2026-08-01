import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteAdminBanner,
  fetchAdminBanners,
  type Banner,
} from '@/src/api/banners';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

const COLORS = {
  primary: '#2C8C55',
  danger: '#C83E3E',
  text: '#222222',
  subtitle: '#6F6F6F',
  border: '#E4E4E4',
  background: '#F7F7F7',
  card: '#FFFFFF',
};

function formatDateTime(value: string | null): string {
  if (!value) return '제한 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBannerStatus(banner: Banner): { label: string; color: string; background: string } {
  if (!banner.is_active) {
    return { label: '비활성', color: '#666666', background: '#EEEEEE' };
  }

  const now = Date.now();
  const startsAt = banner.starts_at ? new Date(banner.starts_at).getTime() : null;
  const endsAt = banner.ends_at ? new Date(banner.ends_at).getTime() : null;

  if (startsAt != null && startsAt > now) {
    return { label: '노출 예정', color: '#8A6300', background: '#FFF3C8' };
  }
  if (endsAt != null && endsAt < now) {
    return { label: '기간 종료', color: '#9A3D3D', background: '#FBE4E4' };
  }
  return { label: '노출 중', color: COLORS.primary, background: '#E5F4EB' };
}

function AdminBannerManagementContent() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBanners = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      setBanners(await fetchAdminBanners());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '배너 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBanners();
    }, [loadBanners]),
  );

  const confirmDelete = (banner: Banner) => {
    Alert.alert('배너 삭제', `“${banner.title}” 배너를 완전히 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeletingId(banner.id);
            try {
              await deleteAdminBanner(banner.id);
              setBanners((current) => current.filter((item) => item.id !== banner.id));
            } catch (reason) {
              Alert.alert(
                '삭제 실패',
                reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.',
              );
            } finally {
              setDeletingId(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminDashboardScreen')} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>메인 배너 관리</Text>
        <Pressable
          style={styles.addHeaderButton}
          onPress={() => router.push('/AdminBannerEditorScreen')}
          accessibilityRole="button"
          accessibilityLabel="배너 추가">
          <Ionicons name="add" size={25} color={COLORS.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadBanners(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }>
          <View style={styles.introRow}>
            <View>
              <Text style={styles.countText}>전체 {banners.length}개</Text>
              <Text style={styles.introText}>정렬 순서가 낮은 배너부터 노출됩니다.</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadBanners()}>
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : banners.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="images-outline" size={38} color="#AAAAAA" />
              <Text style={styles.emptyTitle}>등록된 배너가 없습니다.</Text>
              <Text style={styles.emptyText}>새 배너를 등록하면 대독PICK 홈에 노출할 수 있어요.</Text>
            </View>
          ) : (
            banners.map((banner) => {
              const status = getBannerStatus(banner);
              const isDeleting = deletingId === banner.id;
              return (
                <View key={banner.id} style={styles.bannerCard}>
                  <Image
                    source={{ uri: banner.image_url }}
                    style={styles.bannerImage}
                    contentFit="cover"
                  />
                  <View style={styles.bannerBody}>
                    <View style={styles.bannerTitleRow}>
                      <Text style={styles.bannerTitle} numberOfLines={2}>
                        {banner.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.metaText}>정렬 순서 {banner.sort_order}</Text>
                    <Text style={styles.metaText}>
                      {formatDateTime(banner.starts_at)} ~ {formatDateTime(banner.ends_at)}
                    </Text>
                    <View style={styles.cardActions}>
                      <Pressable
                        style={styles.editButton}
                        onPress={() =>
                          router.push({
                            pathname: '/AdminBannerEditorScreen',
                            params: { id: banner.id },
                          })
                        }>
                        <Ionicons name="create-outline" size={17} color={COLORS.primary} />
                        <Text style={styles.editText}>편집</Text>
                      </Pressable>
                      <Pressable
                        style={styles.deleteButton}
                        disabled={isDeleting}
                        onPress={() => confirmDelete(banner)}>
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={COLORS.danger} />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                            <Text style={styles.deleteText}>삭제</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function AdminBannerManagementScreen() {
  return (
    <AdminRouteGuard>
      <AdminBannerManagementContent />
    </AdminRouteGuard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    color: COLORS.text,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }),
  },
  addHeaderButton: {
    width: 28,
    alignItems: 'flex-end',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 36, gap: 14 },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  countText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  introText: { fontSize: 12, color: COLORS.subtitle },
  emptyCard: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 24,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: 13, lineHeight: 19, color: COLORS.subtitle, textAlign: 'center' },
  errorText: { fontSize: 13, lineHeight: 19, color: COLORS.danger, textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  bannerCard: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerImage: { width: '100%', aspectRatio: 2.2, backgroundColor: '#ECECEC' },
  bannerBody: { padding: 14 },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  bannerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text },
  statusBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 12, lineHeight: 18, color: COLORS.subtitle },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  editButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 9,
    backgroundColor: '#EAF5EF',
  },
  editText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  deleteButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 9,
    backgroundColor: '#FDECEC',
  },
  deleteText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
});
