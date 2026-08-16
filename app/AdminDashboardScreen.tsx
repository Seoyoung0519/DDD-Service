import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';
import { AppConfirmModal } from '@/src/components/ui/AppConfirmModal';
import { logoutFromApp } from '@/src/features/auth/logout';

const COLORS = {
  primary: '#2C8C55',
  text: '#222222',
  subtitle: '#666666',
  border: '#E4E4E4',
  background: '#F7F7F7',
  card: '#FFFFFF',
};

function AdminDashboardContent() {
  const router = useRouter();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const confirmLogout = () => {
    if (loggingOut) return;
    setLogoutVisible(true);
  };

  const runLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutFromApp();
      setLogoutVisible(false);
      router.replace('/login');
    } catch (reason) {
      setLoggingOut(false);
      Alert.alert(
        '로그아웃 실패',
        reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>관리자 센터</Text>
        <Pressable
          style={styles.logoutButton}
          onPress={confirmLogout}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="관리자 로그아웃">
          <Ionicons name="log-out-outline" size={18} color="#C54242" />
          <Text style={styles.logoutText}>{loggingOut ? '처리 중' : '로그아웃'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>대독단 앱에 노출되는 운영 콘텐츠를 관리합니다.</Text>

        <Pressable
          style={[styles.menuCard, styles.userScreenCard]}
          onPress={() => router.push('/Drawer_1')}
          accessibilityRole="button"
          accessibilityLabel="사용자 화면 보기">
          <View style={[styles.iconWrap, styles.userScreenIcon]}>
            <Ionicons name="phone-portrait-outline" size={26} color="#3D5F9B" />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>사용자 화면 보기</Text>
            <Text style={styles.menuSubtitle}>온보딩 없이 일반 사용자용 앱 화면을 확인해요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.subtitle} />
        </Pressable>

        <Pressable
          style={styles.menuCard}
          onPress={() => router.push('/AdminBannerManagementScreen')}
          accessibilityRole="button"
          accessibilityLabel="메인 배너 관리">
          <View style={styles.iconWrap}>
            <Ionicons name="images-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>메인 배너 관리</Text>
            <Text style={styles.menuSubtitle}>배너 등록, 노출 기간, 순서와 활성 상태를 관리해요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.subtitle} />
        </Pressable>

        <Pressable
          style={styles.menuCard}
          onPress={() => router.push('/AdminPickManagementScreen')}
          accessibilityRole="button"
          accessibilityLabel="대독 Pick 관리">
          <View style={styles.iconWrap}>
            <Ionicons name="book-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>대독 Pick 관리</Text>
            <Text style={styles.menuSubtitle}>추천 도서 콘텐츠와 노출 순서를 관리해요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.subtitle} />
        </Pressable>

        <Pressable
          style={styles.menuCard}
          onPress={() => router.push('/AdminDictionaryManagementScreen')}
          accessibilityRole="button"
          accessibilityLabel="대독사전 관리">
          <View style={styles.iconWrap}>
            <Ionicons name="library-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>대독사전 관리</Text>
            <Text style={styles.menuSubtitle}>사전 용어와 정의, 게시 상태를 관리해요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.subtitle} />
        </Pressable>

        <Pressable
          style={styles.menuCard}
          onPress={() => router.push('/AdminEventManagementScreen')}
          accessibilityRole="button"
          accessibilityLabel="이벤트 관리">
          <View style={styles.iconWrap}>
            <Ionicons name="calendar-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>이벤트 관리</Text>
            <Text style={styles.menuSubtitle}>이벤트 기간과 링크, 활성 상태를 관리해요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.subtitle} />
        </Pressable>

        <Pressable
          style={styles.menuCard}
          onPress={() => router.push('/AdminReportManagementScreen')}
          accessibilityRole="button"
          accessibilityLabel="신고 관리">
          <View style={styles.iconWrap}>
            <Ionicons name="flag-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>신고 관리</Text>
            <Text style={styles.menuSubtitle}>사용자와 피드 신고를 조회하고 처리하거나 삭제해요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.subtitle} />
        </Pressable>

        <Pressable
          style={styles.menuCard}
          onPress={() => router.push('/AdminInquiryManagementScreen')}
          accessibilityRole="button"
          accessibilityLabel="문의 관리">
          <View style={styles.iconWrap}>
            <Ionicons name="chatbubbles-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>문의 관리</Text>
            <Text style={styles.menuSubtitle}>1:1 문의를 조회하고 답변하거나 상태를 관리해요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.subtitle} />
        </Pressable>

        <Pressable
          style={styles.menuCard}
          onPress={() => router.push('/AdminNoticeManagementScreen')}
          accessibilityRole="button"
          accessibilityLabel="공지사항 관리">
          <View style={styles.iconWrap}>
            <Ionicons name="megaphone-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>공지사항 관리</Text>
            <Text style={styles.menuSubtitle}>공지 등록, 게시 상태, 내용과 삭제를 관리해요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.subtitle} />
        </Pressable>
      </ScrollView>

      <AppConfirmModal
        visible={logoutVisible}
        title="로그아웃"
        message="관리자 계정에서 로그아웃할까요?"
        confirmLabel="로그아웃"
        confirmLoading={loggingOut}
        onCancel={() => {
          if (!loggingOut) setLogoutVisible(false);
        }}
        onConfirm={() => {
          void runLogout();
        }}
      />
    </SafeAreaView>
  );
}

export default function AdminDashboardScreen() {
  return (
    <AdminRouteGuard>
      <AdminDashboardContent />
    </AdminRouteGuard>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }),
    color: COLORS.text,
  },
  headerSpacer: {
    width: 76,
  },
  logoutButton: {
    width: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C54242',
  },
  body: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.subtitle,
    marginBottom: 6,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5EF',
  },
  userScreenCard: {
    borderColor: '#DCE5F3',
    backgroundColor: '#F7FAFF',
  },
  userScreenIcon: {
    backgroundColor: '#E7EEF9',
  },
  menuTextWrap: {
    flex: 1,
    gap: 5,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.subtitle,
  },
});
