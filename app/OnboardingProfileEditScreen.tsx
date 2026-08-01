import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#666666',
  BORDER: '#E8E8E8',
  BG: '#FFFFFF',
  PAGE_BG: '#F7F7F7',
};

const FONTS = {
  BOLD: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  REGULAR: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

const MENU_ITEMS = [
  {
    title: '사용자 유형',
    description: '직장인·학생 / 기타 유형',
    pathname: '/Onboarding_2' as const,
  },
  {
    title: '독서 프로필',
    description: '닉네임, 선호 장르, 독서 속도·횟수',
    pathname: '/Onboarding_3' as const,
  },
  {
    title: '통근 프로필',
    description: '출·도착지, 통근 시간·요일',
    pathname: '/Onboarding_4' as const,
  },
] as const;

export default function OnboardingProfileEditScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>온보딩 프로필 수정하기</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          온보딩에서 입력한 항목을 다시 수정할 수 있어요.{'\n'}
          저장하면 변경 내용이 반영됩니다.{'\n'}
          독서 속도 테스트는 다시 진행할 수 없습니다.
        </Text>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.pathname}>
              {index > 0 ? <View style={styles.menuDivider} /> : null}
              <Pressable
                style={styles.menuRow}
                onPress={() =>
                  router.push({
                    pathname: item.pathname,
                    params: { edit: '1' },
                  })
                }
                accessibilityRole="button">
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.SUBTITLE} />
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
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
  body: {
    padding: 20,
    paddingBottom: 32,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    marginBottom: 20,
  },
  menuCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 12,
  },
  menuTextCol: {
    flex: 1,
    gap: 4,
  },
  menuTitle: {
    fontSize: 15,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
  },
  menuDescription: {
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: 18,
  },
});
