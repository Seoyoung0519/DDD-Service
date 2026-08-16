import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchCurrentUser } from '@/src/services/auth/authService';

function isAdminOnlyRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/^\//, '');
  return (
    path.startsWith('Admin') ||
    path.includes('/Admin') ||
    path === 'login' ||
    path === 'intro' ||
    path.startsWith('Onboarding') ||
    path === 'onboarding' ||
    path === 'OnboardingAgreementsScreen'
  );
}

/**
 * 관리자 계정이 사용자 화면을 보다가 관리자 센터로 바로 돌아갈 수 있는 플로팅 버튼.
 * 관리자 전용 화면·로그인·온보딩에서는 숨깁니다.
 */
export function AdminReturnFab() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
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
  }, [pathname]);

  if (!isAdmin || isAdminOnlyRoute(pathname)) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          bottom: 88 + Math.max(insets.bottom, 8),
          right: 16,
        },
      ]}>
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.replace('/AdminDashboardScreen')}
        accessibilityRole="button"
        accessibilityLabel="관리자 센터로 돌아가기">
        <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>관리자로</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    zIndex: 1000,
    elevation: 12,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: '#3D5F9B',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabPressed: {
    opacity: 0.88,
  },
  fabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
