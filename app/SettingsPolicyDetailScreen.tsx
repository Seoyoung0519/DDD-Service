import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PolicyDocument, PolicyType } from '@/src/api/settings';
import { APP_POLICY_TYPES, getAppPolicy } from '@/src/constants/appPolicies';

export default function SettingsPolicyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string | string[];
    version?: string | string[];
  }>();
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const type = APP_POLICY_TYPES.includes(rawType as PolicyType)
    ? (rawType as PolicyType)
    : null;

  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type) {
      setError('약관 종류가 올바르지 않습니다.');
      setLoading(false);
      return;
    }
    const selected = getAppPolicy(type);
    setPolicy(selected);
    setLoading(false);
    setError(null);

    if (selected.contentUrl) {
      void Linking.openURL(selected.contentUrl).catch(() => {
        // 외부 브라우저를 열지 못하면 아래 안내 화면을 유지합니다.
      });
    }
  }, [type]);

  const openExternal = async () => {
    if (!policy?.contentUrl) return;
    try {
      await Linking.openURL(policy.contentUrl);
    } catch {
      setError('약관 문서를 열지 못했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>약관 문서</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2C8C55" />
        </View>
      ) : error || !policy ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? '약관 문서를 찾을 수 없습니다.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{policy.title}</Text>
          <Text style={styles.meta}>
            버전 {policy.version} · 시행일 {policy.effectiveDate}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.bodyText}>
            약관 전문은 외부 페이지에서 확인할 수 있습니다.
          </Text>
          {policy.contentUrl ? (
            <Pressable style={styles.openButton} onPress={() => void openExternal()}>
              <Text style={styles.openButtonText}>약관 문서 열기</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    color: '#222222',
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'sans-serif',
    }),
  },
  headerSpacer: { width: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 22, paddingBottom: 40 },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: '#222222' },
  meta: { fontSize: 12, color: '#777777', marginTop: 9 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E6E6E6', marginVertical: 22 },
  bodyText: { fontSize: 14, lineHeight: 25, color: '#3A3A3A' },
  openButton: {
    marginTop: 22,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#2C8C55',
  },
  openButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  errorText: { fontSize: 14, lineHeight: 20, color: '#707070', textAlign: 'center' },
});
