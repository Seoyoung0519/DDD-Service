import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';

import {
  checkNicknameAvailable,
  getNicknameCheckMessage,
  getUserProfile,
  updateUserProfile,
  type CheckNicknameResponse,
} from '@/src/api/userProfile';
import {
  getUserAvatarList,
  getUserAvatarSource,
  isUserAvatarId,
  type UserAvatarId,
} from '@/src/constants/userAvatars';

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#222222',
  SUBTITLE: '#666666',
  BORDER: '#E8E8E8',
  BG: '#FFFFFF',
  INPUT_BG: '#F7F7F7',
  ERROR: '#D32F2F',
  OK: '#2C8C55',
  PAGE_BG: '#F7F7F7',
};

const FONTS = {
  BOLD: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  MEDIUM: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }),
  REGULAR: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

const AVATAR_LIST = getUserAvatarList();
const NICKNAME_DEBOUNCE_MS = 400;

export default function ProfileEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string }>();
  const nicknameInputRef = useRef<TextInput>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [originalNickname, setOriginalNickname] = useState('');
  const [originalAvatarId, setOriginalAvatarId] = useState<UserAvatarId | null>(null);

  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState<UserAvatarId | null>(null);
  const [nicknameCheck, setNicknameCheck] = useState<CheckNicknameResponse | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);

  const trimmedNickname = nickname.trim();
  const nicknameChanged = trimmedNickname !== originalNickname;
  const avatarChanged = avatarId !== originalAvatarId;
  const hasChanges = nicknameChanged || avatarChanged;

  const nicknameStatus = useMemo(() => {
    if (!nicknameChanged) {
      return { tone: 'idle' as const, message: '' };
    }
    if (trimmedNickname === originalNickname) {
      return { tone: 'ok' as const, message: '사용 가능한 닉네임입니다' };
    }
    return getNicknameCheckMessage(nicknameCheck, trimmedNickname);
  }, [nicknameChanged, trimmedNickname, originalNickname, nicknameCheck]);

  const canSave = useMemo(() => {
    if (!hasChanges || saving) return false;
    if (nicknameChanged) {
      if (!trimmedNickname || trimmedNickname.length > 20) return false;
      if (trimmedNickname !== originalNickname) {
        if (nicknameChecking) return false;
        if (!nicknameCheck?.available) return false;
      }
    }
    if (avatarChanged && avatarId && !isUserAvatarId(avatarId)) return false;
    return true;
  }, [
    hasChanges,
    saving,
    nicknameChanged,
    trimmedNickname,
    originalNickname,
    nicknameChecking,
    nicknameCheck,
    avatarChanged,
    avatarId,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const profile = await getUserProfile();
      const nick = profile.nickname?.trim() ?? '';
      const av = isUserAvatarId(profile.avatarId) ? profile.avatarId : 'avatar_01';
      setOriginalNickname(nick);
      setOriginalAvatarId(av);
      setNickname(nick);
      setAvatarId(av);
      setNicknameCheck(null);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e != null && 'message' in e
          ? String((e as { message: unknown }).message)
          : '프로필을 불러오지 못했습니다.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (params.focus === 'nickname' && !loading) {
      const t = setTimeout(() => nicknameInputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [loading, params.focus]);

  useEffect(() => {
    if (!nicknameChanged || trimmedNickname === originalNickname) {
      setNicknameCheck(null);
      setNicknameChecking(false);
      return undefined;
    }

    if (!trimmedNickname) {
      setNicknameCheck({ available: false, reason: 'length' });
      setNicknameChecking(false);
      return undefined;
    }

    setNicknameChecking(true);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const result = await checkNicknameAvailable(trimmedNickname);
          setNicknameCheck(result);
        } catch {
          setNicknameCheck(null);
        } finally {
          setNicknameChecking(false);
        }
      })();
    }, NICKNAME_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [nicknameChanged, trimmedNickname, originalNickname]);

  const onSave = async () => {
    if (!canSave) {
      if (!hasChanges) {
        Alert.alert('안내', '변경된 내용이 없습니다.');
      }
      return;
    }

    setSaving(true);
    try {
      const body: { nickname?: string; avatarId?: string } = {};
      if (nicknameChanged) body.nickname = trimmedNickname;
      if (avatarChanged && avatarId) body.avatarId = avatarId;

      const result = await updateUserProfile(body);
      Alert.alert('저장 완료', '프로필이 저장되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
      if (result.nickname != null) setOriginalNickname(result.nickname.trim());
      if (result.avatarId && isUserAvatarId(result.avatarId)) {
        setOriginalAvatarId(result.avatarId);
        setAvatarId(result.avatarId);
      }
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e != null && 'message' in e
          ? String((e as { message: unknown }).message)
          : '프로필 저장에 실패했습니다.';
      Alert.alert('저장 실패', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>프로필 수정하기</Text>
        <Pressable
          onPress={() => void onSave()}
          disabled={!canSave}
          hitSlop={8}
          accessibilityRole="button">
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>저장</Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>프로필 이미지</Text>
          <View style={styles.avatarPreviewWrap}>
            <Image
              source={getUserAvatarSource(avatarId)}
              style={styles.avatarPreview}
              contentFit="cover"
            />
          </View>

          <View style={styles.avatarGrid}>
            {AVATAR_LIST.map((item) => {
              const selected = avatarId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setAvatarId(item.id)}
                  style={[styles.avatarCell, selected && styles.avatarCellSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <Image source={item.source} style={styles.avatarThumb} contentFit="cover" />
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 24 }]}>닉네임</Text>
          <TextInput
            ref={nicknameInputRef}
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력해 주세요"
            placeholderTextColor={COLORS.SUBTITLE}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {nicknameChanged ? (
            <Text
              style={[
                styles.hint,
                nicknameStatus.tone === 'ok' && styles.hintOk,
                nicknameStatus.tone === 'error' && styles.hintError,
              ]}>
              {nicknameChecking ? '닉네임 확인 중...' : nicknameStatus.message}
            </Text>
          ) : (
            <Text style={styles.hint}>1~20자, 공백은 앞뒤에서 제거됩니다</Text>
          )}
        </KeyboardAwareScrollView>
      )}
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
  saveText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
    minWidth: 40,
    textAlign: 'right',
  },
  saveTextDisabled: {
    color: '#BBBBBB',
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
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontFamily: FONTS.MEDIUM,
    marginBottom: 10,
  },
  avatarPreviewWrap: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.BORDER,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  avatarCell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCellSelected: {
    borderColor: COLORS.TEXT,
  },
  avatarThumb: {
    width: '100%',
    height: '100%',
  },
  input: {
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.TEXT,
    fontFamily: FONTS.REGULAR,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
  },
  hintOk: {
    color: COLORS.OK,
  },
  hintError: {
    color: COLORS.ERROR,
  },
});
