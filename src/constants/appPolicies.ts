import type { PolicyDocument, PolicyType } from '@/src/api/settings';

/** 앱에서 사용하는 필수 약관 문서 (외부 호스팅) */
export const APP_POLICY_DOCUMENTS: Record<PolicyType, PolicyDocument> = {
  terms: {
    type: 'terms',
    version: '1.0.0',
    title: '이용약관',
    contentUrl: 'https://daedokdan-policy.vercel.app/terms.html',
    content: null,
    effectiveDate: '2026-01-01',
  },
  privacy: {
    type: 'privacy',
    version: '1.0.0',
    title: '개인정보 처리방침',
    contentUrl: 'https://daedokdan-policy.vercel.app/privacy.html',
    content: null,
    effectiveDate: '2026-01-01',
  },
  location: {
    type: 'location',
    version: '1.0.0',
    title: '위치기반서비스 이용약관',
    contentUrl: 'https://daedokdan-policy.vercel.app/location.html',
    content: null,
    effectiveDate: '2026-01-01',
  },
};

export const APP_POLICY_TYPES: PolicyType[] = ['terms', 'privacy', 'location'];

export const APP_POLICY_LABELS: Record<PolicyType, string> = {
  terms: '이용약관',
  privacy: '개인정보 처리방침',
  location: '위치기반서비스 이용약관',
};

export function getAppPolicy(type: PolicyType): PolicyDocument {
  return APP_POLICY_DOCUMENTS[type];
}

export function getAppPoliciesByType(): Record<PolicyType, PolicyDocument[]> {
  return {
    terms: [APP_POLICY_DOCUMENTS.terms],
    privacy: [APP_POLICY_DOCUMENTS.privacy],
    location: [APP_POLICY_DOCUMENTS.location],
  };
}
