import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchAppVersion,
  type AppVersionResponse,
  type SettingsPlatform,
} from '@/src/api/settings';

const APP_INFO_LOGO = require('../assets/images/splash/app-icon.png');

const COLORS = {
  primary: '#2C8C55',
  text: '#222222',
  subtitle: '#707070',
  border: '#E6E6E6',
  background: '#F7F7F7',
  card: '#FFFFFF',
  warning: '#A76500',
};

function currentPlatform(): SettingsPlatform {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return 'web';
}

function versionParts(value: string): number[] {
  return value
    .split('.')
    .map((part) => Number.parseInt(part.replace(/\D.*$/, ''), 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

function compareVersions(left: string, right: string): number {
  const a = versionParts(left);
  const b = versionParts(right);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export default function SettingsAppInfoScreen() {
  const router = useRouter();
  const installedVersion = Constants.expoConfig?.version ?? '1.0.0';
  const [versionInfo, setVersionInfo] = useState<AppVersionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setVersionInfo(await fetchAppVersion(currentPlatform()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '버전 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const needsUpdate =
    versionInfo != null && compareVersions(installedVersion, versionInfo.latestVersion) < 0;
  const belowMinimum =
    versionInfo != null && compareVersions(installedVersion, versionInfo.minimumVersion) < 0;

  const openStore = async () => {
    if (!versionInfo?.updateUrl) return;
    try {
      await Linking.openURL(versionInfo.updateUrl);
    } catch {
      Alert.alert('스토어 이동 실패', '업데이트 페이지를 열지 못했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>앱 정보</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <ExpoImage source={APP_INFO_LOGO} style={styles.appIcon} contentFit="cover" />
        <Text style={styles.appName}>대독단</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : versionInfo ? (
          <>
            <View style={styles.versionCard}>
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>현재 버전</Text>
                <Text style={styles.versionValue}>{installedVersion}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>최신 버전</Text>
                <Text style={styles.versionValue}>{versionInfo.latestVersion}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>최소 지원 버전</Text>
                <Text style={styles.versionValue}>{versionInfo.minimumVersion}</Text>
              </View>
            </View>

            <View
              style={[
                styles.statusCard,
                needsUpdate ? styles.updateStatusCard : styles.latestStatusCard,
              ]}>
              <Ionicons
                name={needsUpdate ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={23}
                color={needsUpdate ? COLORS.warning : COLORS.primary}
              />
              <View style={styles.statusTextWrap}>
                <Text style={styles.statusTitle}>
                  {belowMinimum || versionInfo.forceUpdate
                    ? '필수 업데이트가 필요합니다.'
                    : needsUpdate
                      ? '새 버전을 사용할 수 있습니다.'
                      : '최신 버전을 사용하고 있습니다.'}
                </Text>
                {needsUpdate ? (
                  <Text style={styles.statusDescription}>
                    안정적인 이용을 위해 최신 버전으로 업데이트해 주세요.
                  </Text>
                ) : null}
              </View>
            </View>

            {needsUpdate ? (
              <Pressable style={styles.updateButton} onPress={() => void openStore()}>
                <Text style={styles.updateButtonText}>업데이트 페이지 열기</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: COLORS.text },
  headerSpacer: { width: 28 },
  content: { flex: 1, alignItems: 'center', padding: 22, paddingTop: 42 },
  appIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: 'hidden',
  },
  appName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 13, marginBottom: 25 },
  loader: { marginTop: 30 },
  stateCard: {
    width: '100%',
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    padding: 20,
  },
  errorText: { fontSize: 13, lineHeight: 19, color: COLORS.subtitle, textAlign: 'center' },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: COLORS.primary,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  versionCard: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  versionRow: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
  },
  versionLabel: { fontSize: 13, color: COLORS.subtitle },
  versionValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 17, backgroundColor: COLORS.border },
  statusCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 13,
    padding: 15,
    marginTop: 14,
  },
  latestStatusCard: { backgroundColor: '#EAF5EF' },
  updateStatusCard: { backgroundColor: '#FFF3D8' },
  statusTextWrap: { flex: 1, gap: 4 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  statusDescription: { fontSize: 12, lineHeight: 18, color: COLORS.subtitle },
  updateButton: {
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    marginTop: 14,
  },
  updateButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
