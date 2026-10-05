import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestLocationPermissions } from '@/src/features/readingSession/services/locationService';
import {
  markDevicePermissionsDisclosureCompleted,
} from '@/src/services/permissions/devicePermissionsDisclosure';
import { initializePushNotifications } from '@/src/services/push/pushNotificationService';

const LOCATION_POLICY_URL = 'https://daedokdan-policy.vercel.app/location.html';

const DISCLOSURE_BULLETS = [
  '독서 세션(이동 독서) 중 현재 위치를 수집해 지도에 표시하고, 환승·도착 시점 알림을 보냅니다.',
  '세션이 진행되는 동안에는 앱을 닫거나 다른 앱을 사용 중이어도(백그라운드) 위치를 수집할 수 있습니다.',
  '위치 정보는 독서 세션 안내 목적으로만 사용하며, 세션이 끝나면 백그라운드 추적을 중단합니다.',
] as const;

function shouldInitPushAfterRoute(nextPath: string): boolean {
  const path = nextPath.split('?')[0];
  return path === '/DaedokPick' || path === '/Drawer_1';
}

export default function DevicePermissionsDisclosureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = useMemo(() => {
    const trimmed = rawNext?.trim();
    return trimmed && trimmed.startsWith('/') ? trimmed : '/onboarding';
  }, [rawNext]);

  const [submitting, setSubmitting] = useState(false);

  const finishAndNavigate = async (requestPermissions: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await markDevicePermissionsDisclosureCompleted();
      if (requestPermissions) {
        await requestLocationPermissions({ fromProminentDisclosure: true });
      }
      if (shouldInitPushAfterRoute(nextPath)) {
        void initializePushNotifications();
      }
      router.replace(nextPath as Href);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.logo}>대독단</Text>
        <Text style={styles.stepLabel}>위치 정보 안내</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="location" size={36} color="#2C8C55" />
        </View>
        <Text style={styles.title}>{`이동 독서를 위해\n위치 접근이 필요해요`}</Text>
        <Text style={styles.lead}>
          아래 내용을 확인하신 뒤 「위치 접근 허용」을 누르면 Android/iOS 시스템 권한
          요청 화면이 표시됩니다. 「나중에」를 선택하면 지금은 권한 창을 띄우지 않고
          앱을 계속 이용할 수 있습니다.
        </Text>

        <View style={styles.disclosureCard}>
          <Text style={styles.disclosureHeading}>수집·이용 안내 (필수 확인)</Text>
          {DISCLOSURE_BULLETS.map((line) => (
            <View key={line} style={styles.bulletRow}>
              <Text style={styles.bulletMark}>•</Text>
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.policyLink}
          onPress={() => void Linking.openURL(LOCATION_POLICY_URL)}
          hitSlop={8}>
          <Text style={styles.policyLinkText}>위치기반서비스 이용약관 전문 보기</Text>
          <Ionicons name="open-outline" size={16} color="#2C8C55" />
        </Pressable>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          disabled={submitting}
          onPress={() => void finishAndNavigate(true)}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>위치 접근 허용</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
          disabled={submitting}
          onPress={() => void finishAndNavigate(false)}>
          <Text style={styles.secondaryButtonText}>나중에</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E4',
  },
  logo: { fontSize: 18, fontWeight: '700', color: '#222222' },
  stepLabel: { fontSize: 12, fontWeight: '600', color: '#2C8C55' },
  content: { padding: 22, paddingBottom: 28 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5EF',
    marginTop: 8,
    marginBottom: 16,
  },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#222222' },
  lead: { fontSize: 14, lineHeight: 21, color: '#707070', marginTop: 12, marginBottom: 20 },
  disclosureCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#CDE6D7',
    backgroundColor: '#F6FBF8',
    padding: 16,
    gap: 10,
  },
  disclosureHeading: { fontSize: 14, fontWeight: '700', color: '#235D3C', marginBottom: 4 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bulletMark: { fontSize: 14, lineHeight: 21, color: '#2C8C55', fontWeight: '700' },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21, color: '#333333' },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  policyLinkText: { fontSize: 13, fontWeight: '600', color: '#2C8C55' },
  bottom: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#2C8C55',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondaryButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: '#666666' },
  buttonDisabled: { opacity: 0.5 },
});
