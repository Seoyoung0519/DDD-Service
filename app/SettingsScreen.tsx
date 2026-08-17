import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchCurrentUser } from '@/src/services/auth/authService';
import { APP_FONTS } from '@/src/theme/fonts';

const COLORS = {
  primary: '#2C8C55',
  text: '#222222',
  subtitle: '#707070',
  border: '#E6E6E6',
  background: '#F7F7F7',
  card: '#FFFFFF',
  danger: '#C54242',
  admin: '#3D5F9B',
};

type MenuItem = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route:
    | '/SettingsNoticesScreen'
    | '/SettingsAgreementsScreen'
    | '/SettingsInquiriesScreen'
    | '/SettingsAppInfoScreen'
    | '/OtherScreen'
    | '/SettingsDeleteAccountScreen'
    | '/AdminDashboardScreen';
  danger?: boolean;
  adminOnly?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  {
    title: '공지사항',
    subtitle: '업데이트와 이벤트 소식을 확인해요.',
    icon: 'megaphone-outline',
    route: '/SettingsNoticesScreen',
  },
  {
    title: '1:1 문의',
    subtitle: '문의 등록과 관리자 답변을 확인해요.',
    icon: 'chatbubble-ellipses-outline',
    route: '/SettingsInquiriesScreen',
  },
  {
    title: '약관 및 동의',
    subtitle: '이용약관과 개인정보·마케팅 동의를 관리해요.',
    icon: 'document-text-outline',
    route: '/SettingsAgreementsScreen',
  },
  {
    title: '앱 정보',
    subtitle: '설치된 앱 버전과 업데이트 정보를 확인해요.',
    icon: 'information-circle-outline',
    route: '/SettingsAppInfoScreen',
  },
  {
    title: '대독사전',
    subtitle: '나에게 맞는 도서 장르를 살펴봐요.',
    icon: 'book-outline',
    route: '/OtherScreen',
  },
  {
    title: '관리자 센터로 돌아가기',
    subtitle: '배너·픽·신고·문의 등 운영 화면으로 이동합니다.',
    icon: 'shield-checkmark-outline',
    route: '/AdminDashboardScreen',
    adminOnly: true,
  },
  {
    title: '계정 탈퇴',
    subtitle: '대독단 계정과 데이터를 삭제합니다.',
    icon: 'person-remove-outline',
    route: '/SettingsDeleteAccountScreen',
    danger: true,
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const user = await fetchCurrentUser();
          if (active) setIsAdmin(user.role === 'admin');
        } catch {
          if (active) setIsAdmin(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const visibleItems = MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>계정과 앱 이용 정보를 관리할 수 있어요.</Text>

        <View style={styles.menuCard}>
          {visibleItems.map((item, index) => (
            <React.Fragment key={item.title}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={styles.menuRow}
                onPress={() => {
                  if (item.route === '/AdminDashboardScreen') {
                    router.replace('/AdminDashboardScreen');
                    return;
                  }
                  router.push(item.route);
                }}
                accessibilityRole="button"
                accessibilityLabel={item.title}>
                <View
                  style={[
                    styles.iconWrap,
                    item.danger
                      ? styles.dangerIconWrap
                      : item.adminOnly
                        ? styles.adminIconWrap
                        : styles.defaultIconWrap,
                  ]}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={
                      item.danger ? COLORS.danger : item.adminOnly ? COLORS.admin : COLORS.primary
                    }
                  />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text
                    style={[
                      styles.menuTitle,
                      item.danger && styles.dangerText,
                      item.adminOnly && styles.adminText,
                    ]}>
                    {item.title}
                  </Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999999" />
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    fontFamily: APP_FONTS.MEDIUM,
  },
  headerSpacer: { width: 28 },
  content: { padding: 20, paddingBottom: 36 },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.subtitle,
    marginBottom: 16,
  },
  menuCard: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  menuRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  iconWrap: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultIconWrap: { backgroundColor: '#EAF5EF' },
  adminIconWrap: { backgroundColor: '#E7EEF9' },
  dangerIconWrap: { backgroundColor: '#FCEAEA' },
  menuTextWrap: { flex: 1, gap: 4 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  dangerText: { color: COLORS.danger },
  adminText: { color: COLORS.admin },
  menuSubtitle: { fontSize: 12, lineHeight: 17, color: COLORS.subtitle },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 72,
  },
});
