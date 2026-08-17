import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_FONTS } from '@/src/theme/fonts';

import {
  formatOnboardedAtLabel,
  getUserProfile,
  type UserProfileResponse,
} from '@/src/api/userProfile';
import { getUserAvatarSource } from '@/src/constants/userAvatars';
import { AppConfirmModal } from '@/src/components/ui/AppConfirmModal';
import { logoutFromApp } from '@/src/features/auth/logout';

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#666666',
  BORDER: '#E8E8E8',
  BG: '#FFFFFF',
  BTN_DARK: '#555555',
  PAGE_BG: '#F7F7F7',
};

const FONTS = APP_FONTS;

export default function AccountManagementScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e != null && 'message' in e
          ? String((e as { message: unknown }).message)
          : '프로필을 불러오지 못했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const nickname = profile?.nickname?.trim() || '닉네임 없음';
  const joinLine = formatOnboardedAtLabel(profile?.onboardedAt);

  const onLogout = () => {
    setLogoutVisible(true);
  };

  const confirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutFromApp();
      setLogoutVisible(false);
      router.replace('/login');
    } catch {
      setLoggingOut(false);
      Alert.alert('로그아웃 실패', '잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>계정 관리</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void loadProfile()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>나의 프로필</Text>

          <View style={styles.profileCard}>
            <Pressable
              style={styles.avatarWrap}
              onPress={() => router.push('/ProfileEditScreen')}
              accessibilityRole="button"
              accessibilityLabel="프로필 수정">
              <Image
                source={getUserAvatarSource(profile?.avatarId)}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={12} color={COLORS.TEXT} />
              </View>
            </Pressable>

            <View style={styles.profileTextCol}>
              <Text style={styles.nickname}>{`\u201C${nickname}\u201D`}</Text>
              <Text style={styles.joinLine}>{joinLine}</Text>
            </View>
          </View>

          <Pressable
            style={styles.nicknameChangeBtn}
            onPress={() => router.push('/ProfileEditScreen')}
            accessibilityRole="button">
            <Text style={styles.nicknameChangeText}>프로필 수정하기</Text>
          </Pressable>

          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push('/OnboardingProfileEditScreen')}
              accessibilityRole="button">
              <Text style={styles.menuText}>온보딩 프로필 수정하기</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuRow} onPress={onLogout} accessibilityRole="button">
              <Text style={styles.menuText}>로그아웃</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      <AppConfirmModal
        visible={logoutVisible}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmLabel="로그아웃"
        confirmLoading={loggingOut}
        onCancel={() => {
          if (!loggingOut) setLogoutVisible(false);
        }}
        onConfirm={() => {
          void confirmLogout();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  headerSpacer: {
    width: 28,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.SUBTITLE,
    textAlign: 'center',
    fontFamily: FONTS.REGULAR,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
  },
  body: {
    padding: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    marginBottom: 14,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'visible',
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.BORDER,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextCol: {
    flex: 1,
    gap: 6,
  },
  nickname: {
    fontSize: 18,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
  },
  joinLine: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    lineHeight: 19,
  },
  nicknameChangeBtn: {
    backgroundColor: COLORS.BTN_DARK,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  nicknameChangeText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: FONTS.MEDIUM,
  },
  menuCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  menuRow: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  menuText: {
    fontSize: 15,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: 18,
  },
});
