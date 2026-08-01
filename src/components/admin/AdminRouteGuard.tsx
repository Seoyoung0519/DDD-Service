import { useFocusEffect, useRouter } from 'expo-router';
import React, { type ReactNode, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchCurrentUser } from '@/src/services/auth/authService';

type AdminRouteGuardProps = {
  children: ReactNode;
};

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const redirectingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      // retryCount가 바뀌면 현재 포커스에서도 권한 조회를 다시 실행합니다.
      void retryCount;
      redirectingRef.current = false;
      setIsAllowed(false);
      setError(null);

      const verifyAdmin = async () => {
        try {
          const user = await fetchCurrentUser();
          if (!active) return;
          if (user.role === 'admin') {
            setIsAllowed(true);
            return;
          }

          if (!redirectingRef.current) {
            redirectingRef.current = true;
            Alert.alert('접근 권한 없음', '관리자 계정만 이용할 수 있는 기능입니다.');
            router.replace('/AccountManagementScreen');
          }
        } catch (reason) {
          if (!active) return;
          const message =
            reason instanceof Error ? reason.message : '관리자 권한을 확인하지 못했습니다.';
          setError(message);
        }
      };

      void verifyAdmin();
      return () => {
        active = false;
      };
    }, [retryCount, router]),
  );

  if (isAllowed) return <>{children}</>;

  return (
    <View style={styles.center}>
      {error ? (
        <>
          <Text style={styles.errorTitle}>권한 확인 실패</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
              <Text style={styles.secondaryButtonText}>돌아가기</Text>
            </Pressable>
            <Pressable style={styles.retryButton} onPress={() => setRetryCount((value) => value + 1)}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#2C8C55" />
          <Text style={styles.message}>관리자 권한을 확인하고 있어요.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F7F7',
    gap: 12,
  },
  message: {
    fontSize: 14,
    color: '#666666',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    minWidth: 94,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D6D6D6',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555555',
  },
  retryButton: {
    minWidth: 94,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#2C8C55',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
