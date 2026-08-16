import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createAdminBanner,
  fetchAdminBanner,
  updateAdminBanner,
  type CreateBannerInput,
} from '@/src/api/banners';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';
import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';
import { remoteImageSource } from '@/src/utils/mediaUrl';

const COLORS = {
  primary: '#2C8C55',
  text: '#222222',
  subtitle: '#6F6F6F',
  border: '#E1E1E1',
  background: '#F7F7F7',
  card: '#FFFFFF',
  input: '#FAFAFA',
};

type PickerState = {
  field: 'startsAt' | 'endsAt';
  mode: 'date' | 'time';
};

function isHttpUrl(value: string | null | undefined): boolean {
  return /^https?:\/\/\S+$/i.test(value?.trim() ?? '');
}

function formatDate(value: Date | null): string {
  if (!value) return '날짜 선택';
  return value.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTime(value: Date | null): string {
  if (!value) return '시간 선택';
  return value.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseApiDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type DateTimeFieldProps = {
  label: string;
  value: Date | null;
  field: PickerState['field'];
  onOpen: (picker: PickerState) => void;
  onClear: () => void;
};

function DateTimeField({ label, value, field, onOpen, onClear }: DateTimeFieldProps) {
  return (
    <View style={styles.dateField}>
      <View style={styles.dateLabelRow}>
        <Text style={styles.label}>{label}</Text>
        {value ? (
          <Pressable onPress={onClear} hitSlop={8}>
            <Text style={styles.clearText}>제한 해제</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.dateControls}>
        <Pressable style={styles.dateButton} onPress={() => onOpen({ field, mode: 'date' })}>
          <Ionicons name="calendar-outline" size={17} color={COLORS.subtitle} />
          <Text style={styles.dateButtonText}>{formatDate(value)}</Text>
        </Pressable>
        <Pressable style={styles.timeButton} onPress={() => onOpen({ field, mode: 'time' })}>
          <Ionicons name="time-outline" size={17} color={COLORS.subtitle} />
          <Text style={styles.dateButtonText}>{formatTime(value)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AdminBannerEditorContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const bannerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditing = Boolean(bannerId);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!bannerId) return;
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const banner = await fetchAdminBanner(bannerId);
        if (!active) return;
        setTitle(banner.title ?? '');
        setImageUrl(banner.image_url ?? '');
        setLinkUrl(banner.link_url ?? '');
        setSortOrder(String(banner.sort_order));
        setIsActive(banner.is_active);
        setStartsAt(parseApiDate(banner.starts_at));
        setEndsAt(parseApiDate(banner.ends_at));
      } catch (reason) {
        if (active) {
          setLoadError(
            reason instanceof Error ? reason.message : '배너 정보를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [bannerId]);

  const previewVisible = useMemo(() => isHttpUrl(imageUrl), [imageUrl]);

  const changeDateTime = (event: DateTimePickerEvent, selected?: Date) => {
    const currentPicker = picker;
    setPicker(null);
    if (!currentPicker || event.type === 'dismissed' || !selected) return;

    const current =
      (currentPicker.field === 'startsAt' ? startsAt : endsAt) ?? new Date();
    const next = new Date(current);

    if (currentPicker.mode === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }

    if (currentPicker.field === 'startsAt') setStartsAt(next);
    else setEndsAt(next);
  };

  const validate = (): CreateBannerInput | null => {
    const cleanTitle = title.trim();
    const cleanImageUrl = imageUrl.trim();
    const cleanLinkUrl = linkUrl.trim();
    const order = Number(sortOrder);

    if (!cleanTitle) {
      Alert.alert('입력 확인', '배너 제목을 입력해 주세요.');
      return null;
    }
    if (!isHttpUrl(cleanImageUrl)) {
      Alert.alert('입력 확인', 'http:// 또는 https://로 시작하는 이미지 URL을 입력해 주세요.');
      return null;
    }
    if (cleanLinkUrl && !isHttpUrl(cleanLinkUrl)) {
      Alert.alert('입력 확인', '이동 링크는 http:// 또는 https://로 시작해야 합니다.');
      return null;
    }
    if (!Number.isInteger(order)) {
      Alert.alert('입력 확인', '정렬 순서는 정수로 입력해 주세요.');
      return null;
    }
    if (startsAt && endsAt && startsAt.getTime() >= endsAt.getTime()) {
      Alert.alert('기간 확인', '노출 종료일은 시작일보다 늦어야 합니다.');
      return null;
    }

    return {
      title: cleanTitle,
      image_url: cleanImageUrl,
      link_url: cleanLinkUrl || null,
      sort_order: order,
      is_active: isActive,
      starts_at: startsAt?.toISOString() ?? null,
      ends_at: endsAt?.toISOString() ?? null,
    };
  };

  const save = async () => {
    const payload = validate();
    if (!payload || isSaving) return;

    setIsSaving(true);
    try {
      if (bannerId) await updateAdminBanner(bannerId, payload);
      else await createAdminBanner(payload);

      Alert.alert(
        isEditing ? '수정 완료' : '등록 완료',
        isEditing ? '배너가 수정되었습니다.' : '새 배너가 등록되었습니다.',
        [{ text: '확인', onPress: () => router.replace('/AdminBannerManagementScreen') }],
      );
    } catch (reason) {
      Alert.alert(
        isEditing ? '수정 실패' : '등록 실패',
        reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const pickerValue =
    picker?.field === 'startsAt' ? startsAt ?? new Date() : endsAt ?? new Date();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminBannerManagementScreen')} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? '배너 편집' : '배너 등록'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/AdminBannerManagementScreen')}>
            <Text style={styles.backButtonText}>목록으로 돌아가기</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>제목 *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="메인 화면에 표시할 제목"
              placeholderTextColor="#AAAAAA"
              maxLength={100}
            />

            <Text style={styles.label}>이미지 URL *</Text>
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/banner.jpg"
              placeholderTextColor="#AAAAAA"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>
              실제 이미지 파일 주소(jpg/png)를 넣어 주세요. Bing 검색 썸네일은 앱에서 막히는 경우가 많습니다.
            </Text>
            {previewVisible ? (
              <Image source={remoteImageSource(imageUrl.trim())} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="image-outline" size={32} color="#AAAAAA" />
                <Text style={styles.previewPlaceholderText}>올바른 이미지 URL을 입력하면 미리 보여요.</Text>
              </View>
            )}

            <Text style={styles.label}>이동 링크</Text>
            <TextInput
              style={styles.input}
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://example.com/event (선택)"
              placeholderTextColor="#AAAAAA"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={styles.label}>정렬 순서</Text>
            <TextInput
              style={styles.input}
              value={sortOrder}
              onChangeText={(value) => setSortOrder(value.replace(/[^0-9-]/g, ''))}
              placeholder="0"
              placeholderTextColor="#AAAAAA"
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.helperText}>숫자가 낮을수록 먼저 노출됩니다.</Text>

            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchTitle}>배너 활성화</Text>
                <Text style={styles.helperText}>비활성 배너는 일반 사용자에게 노출되지 않습니다.</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#CFCFCF', true: '#8BC4A4' }}
                thumbColor={isActive ? COLORS.primary : '#F4F4F4'}
              />
            </View>

            <DateTimeField
              label="노출 시작일"
              value={startsAt}
              field="startsAt"
              onOpen={setPicker}
              onClear={() => setStartsAt(null)}
            />
            <DateTimeField
              label="노출 종료일"
              value={endsAt}
              field="endsAt"
              onOpen={setPicker}
              onClear={() => setEndsAt(null)}
            />

            <Pressable
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              disabled={isSaving}
              onPress={() => void save()}>
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>{isEditing ? '수정 저장' : '배너 등록'}</Text>
              )}
            </Pressable>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      )}

      {picker ? (
        <DateTimePicker
          value={pickerValue}
          mode={picker.mode}
          is24Hour
          display="default"
          onChange={changeDateTime}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function AdminBannerEditorScreen() {
  return (
    <AdminRouteGuard>
      <AdminBannerEditorContent />
    </AdminRouteGuard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginTop: 18 },
  hint: { marginTop: 8, fontSize: 12, lineHeight: 18, color: '#888888' },
  input: {
    minHeight: 50,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.input,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
  },
  preview: {
    width: '100%',
    aspectRatio: 2.2,
    borderRadius: 12,
    backgroundColor: '#ECECEC',
    marginTop: 10,
  },
  previewPlaceholder: {
    width: '100%',
    aspectRatio: 2.2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEEEEE',
    marginTop: 10,
    padding: 20,
  },
  previewPlaceholderText: { fontSize: 12, color: COLORS.subtitle, textAlign: 'center' },
  helperText: { fontSize: 12, lineHeight: 18, color: COLORS.subtitle, marginTop: 6 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    marginTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  switchTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  dateField: { marginTop: 19 },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearText: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginTop: 10 },
  dateControls: { flexDirection: 'row', gap: 8 },
  dateButton: {
    flex: 1.4,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  timeButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  dateButtonText: { fontSize: 13, color: COLORS.text },
  saveButton: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginTop: 30,
  },
  saveButtonDisabled: { opacity: 0.55 },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: COLORS.subtitle },
  backButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
  },
  backButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
