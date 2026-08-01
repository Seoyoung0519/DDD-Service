import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
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
  submitAgreements,
  type PolicyDocument,
  type PolicyType,
  type SettingsPlatform,
} from '@/src/api/settings';
import {
  APP_POLICY_LABELS,
  APP_POLICY_TYPES,
  getAppPoliciesByType,
} from '@/src/constants/appPolicies';
import { cacheAgreementVersions } from '@/src/services/settings/agreementVersionCache';
import {
  clearOnboardingAgreementPending,
  getOnboardingAgreementPendingRoute,
  parseOnboardingAgreementNextRoute,
  type OnboardingAgreementNextRoute,
} from '@/src/services/onboarding/onboardingSkip';
import { initializePushNotifications } from '@/src/services/push/pushNotificationService';

const REQUIRED_TYPES: PolicyType[] = APP_POLICY_TYPES;

function latestPolicy(items: PolicyDocument[]): PolicyDocument | null {
  return items[0] ?? null;
}

function currentPlatform(): SettingsPlatform {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return 'web';
}

function resolveNextRoute(
  rawNext: string | undefined,
  pending: OnboardingAgreementNextRoute | null,
): OnboardingAgreementNextRoute {
  return (
    parseOnboardingAgreementNextRoute(rawNext) ??
    pending ??
    'onboarding'
  );
}

export default function OnboardingAgreementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const [nextRoute, setNextRoute] = useState<OnboardingAgreementNextRoute>(
    () => parseOnboardingAgreementNextRoute(rawNext) ?? 'onboarding',
  );

  const [policies, setPolicies] = useState<Record<PolicyType, PolicyDocument[]>>({
    terms: [],
    privacy: [],
    location: [],
  });
  const [checked, setChecked] = useState<Record<PolicyType, boolean>>({
    terms: false,
    privacy: false,
    location: false,
  });
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const pending = await getOnboardingAgreementPendingRoute();
      if (cancelled) return;
      setNextRoute(resolveNextRoute(rawNext, pending));
    })();
    return () => {
      cancelled = true;
    };
  }, [rawNext]);

  const loadPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      setPolicies(getAppPoliciesByType());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '약관을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicies();
  }, []);

  const latest = useMemo(
    () => ({
      terms: latestPolicy(policies.terms),
      privacy: latestPolicy(policies.privacy),
      location: latestPolicy(policies.location),
    }),
    [policies],
  );

  const allDocumentsExist = REQUIRED_TYPES.every((type) => latest[type] != null);
  const allRequiredChecked = REQUIRED_TYPES.every((type) => checked[type]);
  const canContinue = allDocumentsExist && allRequiredChecked && !submitting;
  const isBeforeOnboarding = nextRoute === 'onboarding';

  const toggleAll = () => {
    const next = !allRequiredChecked;
    setChecked({ terms: next, privacy: next, location: next });
  };

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
        // 앱 내부 본문 화면으로 대체합니다.
      }
    }
    router.push({
      pathname: '/SettingsPolicyDetailScreen',
      params: { type: policy.type, version: policy.version },
    });
  };

  const goAfterAgree = (route: OnboardingAgreementNextRoute) => {
    if (route === 'DaedokPick') {
      void initializePushNotifications();
      router.replace('/DaedokPick');
      return;
    }
    if (route === 'Drawer_1') {
      void initializePushNotifications();
      router.replace('/Drawer_1');
      return;
    }
    if (route === 'Onboarding_8') {
      router.replace('/Onboarding_8');
      return;
    }
    router.replace('/onboarding');
  };

  const submit = async () => {
    if (
      !canContinue ||
      !latest.terms ||
      !latest.privacy ||
      !latest.location
    ) {
      return;
    }

    setSubmitting(true);
    try {
      await submitAgreements({
        termsVersion: latest.terms.version,
        privacyVersion: latest.privacy.version,
        locationTermsVersion: latest.location.version,
        marketingConsent,
        device: currentPlatform(),
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
      });
      await cacheAgreementVersions({
        termsVersion: latest.terms.version,
        privacyVersion: latest.privacy.version,
        locationTermsVersion: latest.location.version,
      });
      await clearOnboardingAgreementPending();
      goAfterAgree(nextRoute);
    } catch (reason) {
      Alert.alert(
        '약관 동의 실패',
        reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.logo}>대독단</Text>
        <Text style={styles.stepLabel}>{isBeforeOnboarding ? '가입 시작' : '필수 동의'}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2C8C55" />
          <Text style={styles.loadingText}>약관을 불러오고 있어요.</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadPolicies()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>
              {isBeforeOnboarding
                ? `서비스 이용을 위해\n약관에 동의해 주세요`
                : `약관 동의가 필요해요`}
            </Text>
            <Text style={styles.description}>
              {isBeforeOnboarding
                ? '필수 약관에 동의하신 뒤 온보딩을 이어갈 수 있어요. 마케팅 수신은 나중에 설정에서도 변경할 수 있습니다.'
                : '가입하신 계정에 약관 동의 기록이 없어 확인이 필요해요. 동의한 뒤에도 설정에서 언제든 변경할 수 있습니다.'}
            </Text>

            <Pressable style={styles.allAgreeRow} onPress={toggleAll}>
              <Ionicons
                name={allRequiredChecked ? 'checkmark-circle' : 'ellipse-outline'}
                size={25}
                color={allRequiredChecked ? '#2C8C55' : '#999999'}
              />
              <Text style={styles.allAgreeText}>필수 약관 전체 동의</Text>
            </Pressable>

            <View style={styles.policyCard}>
              {REQUIRED_TYPES.map((type, index) => {
                const policy = latest[type];
                return (
                  <React.Fragment key={type}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.policyRow}>
                      <Pressable
                        style={styles.checkboxButton}
                        onPress={() =>
                          setChecked((current) => ({ ...current, [type]: !current[type] }))
                        }>
                        <Ionicons
                          name={checked[type] ? 'checkbox' : 'square-outline'}
                          size={23}
                          color={checked[type] ? '#2C8C55' : '#999999'}
                        />
                      </Pressable>
                      <Pressable style={styles.policyTextWrap} onPress={() => void openPolicy(policy)}>
                        <Text style={styles.policyTitle}>
                          <Text style={styles.requiredText}>[필수] </Text>
                          {APP_POLICY_LABELS[type]}
                        </Text>
                        <Text style={styles.policyMeta}>
                          {policy ? `v${policy.version} · ${policy.effectiveDate}` : '문서 없음'}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => void openPolicy(policy)} hitSlop={8}>
                        <Ionicons name="chevron-forward" size={19} color="#999999" />
                      </Pressable>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>

            <View style={styles.marketingRow}>
              <View style={styles.marketingTextWrap}>
                <Text style={styles.marketingTitle}>[선택] 마케팅 정보 수신 동의</Text>
                <Text style={styles.marketingDescription}>
                  이벤트와 추천 도서 소식을 받아볼 수 있어요.
                </Text>
              </View>
              <Switch
                value={marketingConsent}
                onValueChange={setMarketingConsent}
                trackColor={{ false: '#CACACA', true: '#8BC4A4' }}
                thumbColor={marketingConsent ? '#2C8C55' : '#F4F4F4'}
              />
            </View>
          </ScrollView>

          <View style={styles.bottom}>
            <Pressable
              style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
              disabled={!canContinue}
              onPress={() => void submit()}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueText}>동의하고 계속하기</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  loadingText: { fontSize: 13, color: '#777777' },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: '#666666' },
  retryButton: {
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2C8C55',
  },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  content: { padding: 22, paddingBottom: 28 },
  title: { fontSize: 25, lineHeight: 34, fontWeight: '700', color: '#222222', marginTop: 10 },
  description: { fontSize: 14, lineHeight: 21, color: '#707070', marginTop: 12, marginBottom: 24 },
  allAgreeRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 13,
    paddingHorizontal: 16,
    backgroundColor: '#EAF5EF',
    borderWidth: 1,
    borderColor: '#CDE6D7',
  },
  allAgreeText: { fontSize: 15, fontWeight: '700', color: '#235D3C' },
  policyCard: {
    overflow: 'hidden',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    marginTop: 12,
  },
  policyRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  checkboxButton: { paddingRight: 10, paddingVertical: 15 },
  policyTextWrap: { flex: 1, gap: 5, paddingVertical: 13 },
  policyTitle: { fontSize: 14, fontWeight: '600', color: '#222222' },
  requiredText: { color: '#2C8C55' },
  policyMeta: { fontSize: 11, color: '#888888' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14, backgroundColor: '#E6E6E6' },
  marketingRow: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    marginTop: 12,
  },
  marketingTextWrap: { flex: 1, gap: 5 },
  marketingTitle: { fontSize: 14, fontWeight: '600', color: '#222222' },
  marketingDescription: { fontSize: 12, lineHeight: 17, color: '#777777' },
  bottom: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#2C8C55',
  },
  continueButtonDisabled: { opacity: 0.4 },
  continueText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
