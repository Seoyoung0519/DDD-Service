import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Resource = { id: string };

type Props<T extends Resource> = {
  title: string;
  description: string;
  emptyText: string;
  loadItems: () => Promise<T[]>;
  deleteItem: (id: string) => Promise<void>;
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string;
  getStatus?: (item: T) => { label: string; active: boolean };
  onBack: () => void;
  onCreate: () => void;
  onOpen: (item: T) => void;
  headerContent?: React.ReactNode;
};

export function AdminResourceList<T extends Resource>({
  title,
  description,
  emptyText,
  loadItems,
  deleteItem,
  getTitle,
  getSubtitle,
  getStatus,
  onBack,
  onCreate,
  onOpen,
  headerContent,
}: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setItems(await loadItems());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadItems]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const confirmDelete = (item: T) => {
    Alert.alert('삭제 확인', `'${getTitle(item)}' 항목을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteItem(item.id);
              setItems((current) => current.filter((value) => value.id !== item.id));
            } catch (reason) {
              Alert.alert(
                '삭제 실패',
                reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.',
              );
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable onPress={onCreate} hitSlop={10}>
          <Ionicons name="add" size={28} color="#2C8C55" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => void load()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
          }>
          <Text style={styles.description}>{description}</Text>
          {headerContent}
          {items.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>{emptyText}</Text></View>
          ) : (
            items.map((item) => {
              const status = getStatus?.(item);
              return (
                <Pressable key={item.id} style={styles.card} onPress={() => onOpen(item)}>
                  <View style={styles.cardBody}>
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{getTitle(item)}</Text>
                      {status ? (
                        <View style={[styles.badge, status.active && styles.badgeActive]}>
                          <Text style={[styles.badgeText, status.active && styles.badgeTextActive]}>
                            {status.label}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.subtitle} numberOfLines={2}>{getSubtitle(item)}</Text>
                  </View>
                  <Pressable onPress={() => confirmDelete(item)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={21} color="#C83E3E" />
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E4',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#222222' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  error: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 9, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  content: { padding: 18, paddingBottom: 40, gap: 12 },
  description: { fontSize: 13, lineHeight: 20, color: '#666666', marginBottom: 3 },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#888888' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  cardBody: { flex: 1, gap: 7 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#222222' },
  subtitle: { fontSize: 12, lineHeight: 18, color: '#777777' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#EEEEEE' },
  badgeActive: { backgroundColor: '#E5F4EB' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#777777' },
  badgeTextActive: { color: '#237847' },
});
