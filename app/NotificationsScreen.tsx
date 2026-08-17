import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_FONTS } from '@/src/theme/fonts';

import {
  getNotificationInbox,
  markAllNotificationsRead,
  type InboxNotification,
} from '@/src/services/push/notificationInbox';

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222',
  SUBTITLE: '#7A7A7A',
  BG: '#FFFFFF',
  CARD: '#F7F7F7',
  BORDER: '#EAEAEA',
};

const FONTS = APP_FONTS;

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const inbox = await getNotificationInbox();
      setItems(inbox);
      await markAllNotificationsRead();
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>알림</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.PRIMARY} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={40} color={COLORS.SUBTITLE} />
          <Text style={styles.emptyTitle}>받은 알림이 없습니다</Text>
          <Text style={styles.emptyHint}>
            독서 세션 완료·출퇴근 책 추천(오전 8시·오후 6시 30분) 알림이 여기에 표시됩니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.read && styles.cardUnread]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
              <Text style={styles.cardTime}>{formatTime(item.receivedAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  headerSpacer: { width: 28 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: { padding: 16, gap: 10 },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  cardTitle: {
    fontSize: 15,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
    lineHeight: 20,
  },
  cardTime: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
});
