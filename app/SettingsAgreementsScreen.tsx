import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
import { APP_FONTS } from '@/src/theme/fonts';
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  fetchAgreements,
  saveMarketingConsent,
  SettingsApiError,
  submitAgreements,
  type Agreement,
  type AgreementVersionInput,
  type PolicyDocument,
  type PolicyType,
  type SettingsPlatform,
} from '@/src/api/settings';
import {
  APP_POLICY_LABELS,
  getAppPoliciesByType,
} from '@/src/constants/appPolicies';
import {
  cacheAgreementVersions,
  getCachedAgreementVersions,
  type CachedAgreementVersions,
} from '@/src/services/settings/agreementVersionCache';

const COLORS = {
  primary: '#2C8C55',
  text: '#222222',
  subtitle: '#707070',
  border: '#E6E6E6',
  background: '#F7F7F7',
  card: '#FFFFFF',
};

function currentPlatform(): SettingsPlatform {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return 'web';
}

function latestPolicy(items: PolicyDocument[]): PolicyDocument | null {
  return items[0] ?? null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveAgreementVersions(
  agreement: Agreement | null,
  latest: {
    terms: PolicyDocument | null;
    privacy: PolicyDocument | null;
    location: PolicyDocument | null;
  },
  cached: CachedAgreementVersions | null,
): AgreementVersionInput | null {
  if (latest.terms && latest.privacy && latest.location) {
    return {
      termsVersion: latest.terms.version,
      privacyVersion: latest.privacy.version,
      locationTermsVersion: latest.location.version,
    };
  }
  if (
    agreement?.termsVersion &&
    agreement.privacyVersion &&
    agreement.locationTermsVersion
  ) {
    return {
      termsVersion: agreement.termsVersion,
      privacyVersion: agreement.privacyVersion,
      locationTermsVersion: agreement.locationTermsVersion,
    };
  }
  if (cached) return cached;
  return null;
}

export default function SettingsAgreementsScreen() {
  const router = useRouter();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [policies, setPolicies] = useState<Record<PolicyType, PolicyDocument[]>>({
    terms: [],
    privacy: [],
    location: [],
  });
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [cachedVersions, setCachedVersions] = useState<CachedAgreementVersions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMarketing, setSavingMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPolicies(getAppPoliciesByType());

      const cached = await getCachedAgreementVersions();
      setCachedVersions(cached);

      try {
        const current = await fetchAgreements();
        setAgreement(current);
        setMarketingConsent(current.marketingConsent);
      } catch (reason) {
        if (reason instanceof SettingsApiError && reason.status === 404) {
          setAgreement(null);
          setMarketingConsent(false);
        } else {
          throw reason;
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '약관 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const latest = useMemo(
    () => ({
      terms: latestPolicy(policies.terms),
      privacy: latestPolicy(policies.privacy),
      location: latestPolicy(policies.location),
    }),
    [policies],
  );

  const hasAllRequiredPolicies = Boolean(latest.terms && latest.privacy && latest.location);
  const isLatestAgreement =
    agreement != null &&
    agreement.termsVersion === latest.terms?.version &&
    agreement.privacyVersion === latest.privacy?.version &&
    agreement.locationTermsVersion === latest.location?.version;

  const openPolicy = async (policy: PolicyDocument | null) => {
    if (!policy) {
      Alert.alert('약관 문서 없음', '등록된 약관 문서를 찾을 수 없습니다.');
      return;
    }
    if (policy.contentUrl) {
      try {
        await Linking.openURL(policy.contentUrl);
        return;
      } catch {
        // 외부 URL을 열지 못하면 앱 내부 본문 화면으로 진행합니다.
      }
    }
    router.push({
      pathname: '/SettingsPolicyDetailScreen',
      params: { type: policy.type, version: policy.version },
    });
  };

  const agreeRequiredPolicies = async () => {
    if (!latest.terms || !latest.privacy || !latest.location || saving) return;
    setSaving(true);
    try {
      const updated = await submitAgreements({
        termsVersion: latest.terms.version,
        privacyVersion: latest.privacy.version,
        locationTermsVersion: latest.location.version,
        marketingConsent,
        device: currentPlatform(),
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
      });
      setAgreement(updated);
      setMarketingConsent(updated.marketingConsent);
      await cacheAgreementVersions(updated);
      setCachedVersions({
        termsVersion: updated.termsVersion,
        privacyVersion: updated.privacyVersion,
        locationTermsVersion: updated.locationTermsVersion,
      });
      Alert.alert('동의 완료', '약관 동의 내역이 저장되었습니다.');
    } catch (reason) {
      Alert.alert(
        '동의 처리 실패',
        reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSaving(false);
    }
  };

  const changeMarketingConsent = async (nextValue: boolean) => {
    if (savingMarketing) return;
    const previous = marketingConsent;
    setMarketingConsent(nextValue);
    setSavingMarketing(true);

    try {
      if (!nextValue && !agreement) {
        return;
      }

      const versions = resolveAgreementVersions(agreement, latest, cachedVersions);
      if (!versions) {
        setMarketingConsent(previous);
        Alert.alert(
          '약관 버전 정보 없음',
          '필수 약관 문서를 불러오거나 「필수 약관에 모두 동의」를 먼저 진행해 주세요.',
        );
        return;
      }

      const updated = await saveMarketingConsent(
        nextValue,
        versions,
        {
          device: currentPlatform(),
          appVersion: Constants.expoConfig?.version ?? '1.0.0',
        },
        { tryPatchFirst: agreement != null },
      );
      setAgreement(updated);
      setMarketingConsent(updated.marketingConsent);
      await cacheAgreementVersions(updated);
      setCachedVersions({
        termsVersion: updated.termsVersion,
        privacyVersion: updated.privacyVersion,
        locationTermsVersion: updated.locationTermsVersion,
      });
    } catch (reason) {
      setMarketingConsent(previous);
      Alert.alert(
        '변경 실패',
        reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSavingMarketing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>약관 및 동의</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void load()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>필수 약관</Text>
          <View style={styles.card}>
            {(['terms', 'privacy', 'location'] as PolicyType[]).map((type, index) => {
              const policy = latest[type];
              return (
                <React.Fragment key={type}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable style={styles.policyRow} onPress={() => void openPolicy(policy)}>
                    <View style={styles.policyTextWrap}>
                      <Text style={styles.policyTitle}>{APP_POLICY_LABELS[type]}</Text>
                      <Text style={styles.policyVersion}>
                        {policy ? `v${policy.version} · ${policy.effectiveDate}` : '문서 없음'}
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color="#888888" />
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>

          <Pressable
            style={[
              styles.agreeButton,
              (!hasAllRequiredPolicies || saving || isLatestAgreement) && styles.disabledButton,
            ]}
            disabled={!hasAllRequiredPolicies || saving || isLatestAgreement}
            onPress={() => void agreeRequiredPolicies()}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.agreeButtonText}>
                {isLatestAgreement ? '최신 필수 약관 동의 완료' : '필수 약관에 모두 동의'}
              </Text>
            )}
          </Pressable>

          <Text style={styles.sectionTitle}>선택 동의</Text>
          <View style={styles.card}>
            <View style={styles.marketingRow}>
              <View style={styles.marketingTextWrap}>
                <Text style={styles.policyTitle}>마케팅 정보 수신 동의</Text>
                <Text style={styles.marketingDescription}>
                  이벤트와 추천 도서 소식을 받을 수 있어요.
                </Text>
              </View>
              {savingMarketing ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Switch
                  value={marketingConsent}
                  onValueChange={(value) => void changeMarketingConsent(value)}
                  trackColor={{ false: '#CACACA', true: '#8BC4A4' }}
                  thumbColor={marketingConsent ? COLORS.primary : '#F4F4F4'}
                />
              )}
            </View>
          </View>
          {!agreement ? (
            <Text style={styles.helperText}>
              마케팅 수신 동의는 스위치로 언제든 변경할 수 있습니다. 서버에 동의 이력이 없으면
              최신 필수 약관 버전과 함께 저장됩니다.
            </Text>
          ) : (
            <>
              <Text style={styles.helperText}>
                마케팅 수신 동의는 필수 약관과 별도로 언제든 변경할 수 있습니다.
              </Text>
              <Text style={styles.helperText}>마지막 동의: {formatDate(agreement.agreedAt)}</Text>
            </>
          )}
        </ScrollView>
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },
  card: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  policyRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  policyTextWrap: { flex: 1, gap: 5 },
  policyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  policyVersion: { fontSize: 12, color: COLORS.subtitle },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16, backgroundColor: COLORS.border },
  agreeButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    marginTop: 14,
    marginBottom: 28,
  },
  disabledButton: { opacity: 0.45 },
  agreeButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  marketingRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  marketingTextWrap: { flex: 1, gap: 5 },
  marketingDescription: { fontSize: 12, lineHeight: 17, color: COLORS.subtitle },
  helperText: { fontSize: 12, lineHeight: 18, color: COLORS.subtitle, marginTop: 9 },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: COLORS.subtitle },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: COLORS.primary,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
