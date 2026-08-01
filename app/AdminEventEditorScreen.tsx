import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import {
  createAdminEvent,
  fetchAdminEvent,
  updateAdminEvent,
} from '@/src/api/adminEvents';
import { AdminEditorScaffold } from '@/src/components/admin/AdminEditorScaffold';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

type Picker = { field: 'start' | 'end'; mode: 'date' | 'time' };
const isUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());
const formatDate = (value: Date) => value.toLocaleDateString('ko-KR');
const formatTime = (value: Date) =>
  value.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

function Content() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const now = new Date();
  const initialEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startsAt, setStartsAt] = useState(now);
  const [endsAt, setEndsAt] = useState(initialEnd);
  const [active, setActive] = useState(true);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void (async () => {
      try {
        const item = await fetchAdminEvent(id);
        if (!mounted) return;
        setTitle(item.title);
        setDescription(item.description);
        setImageUrl(item.image_url ?? '');
        setLinkUrl(item.link_url ?? '');
        setStartsAt(new Date(item.starts_at));
        setEndsAt(new Date(item.ends_at));
        setActive(item.is_active);
      } catch (reason) {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : '이벤트를 불러오지 못했습니다.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const changeDate = (event: DateTimePickerEvent, selected?: Date) => {
    const current = picker;
    setPicker(null);
    if (!current || event.type === 'dismissed' || !selected) return;
    const source = current.field === 'start' ? startsAt : endsAt;
    const next = new Date(source);
    if (current.mode === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }
    if (current.field === 'start') setStartsAt(next);
    else setEndsAt(next);
  };

  const save = async () => {
    if (!title.trim()) return Alert.alert('입력 확인', '이벤트 제목을 입력해 주세요.');
    if (imageUrl.trim() && !isUrl(imageUrl)) {
      return Alert.alert('입력 확인', '이미지 URL을 확인해 주세요.');
    }
    if (linkUrl.trim() && !isUrl(linkUrl)) {
      return Alert.alert('입력 확인', '링크 URL을 확인해 주세요.');
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      return Alert.alert('기간 확인', '종료 일시는 시작 일시보다 늦어야 합니다.');
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      image_url: imageUrl.trim() || null,
      link_url: linkUrl.trim() || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      is_active: active,
    };
    setSaving(true);
    try {
      if (id) await updateAdminEvent(id, payload);
      else await createAdminEvent(payload);
      router.replace('/AdminEventManagementScreen');
    } catch (reason) {
      Alert.alert('저장 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const pickerValue = picker?.field === 'start' ? startsAt : endsAt;
  const imagePreview = imageUrl.trim();

  return (
    <AdminEditorScaffold
      title={id ? '이벤트 편집' : '이벤트 등록'}
      loading={loading}
      error={error}
      saving={saving}
      saveDisabled={!title.trim()}
      onBack={() => router.replace('/AdminEventManagementScreen')}
      onSave={() => void save()}>
      <Section title="기본 정보" subtitle="이벤트 제목과 연결 링크를 입력해요.">
        <Field label="제목 *" value={title} onChangeText={setTitle} placeholder="이벤트 제목" />
        <Field
          label="링크 URL"
          value={linkUrl}
          onChangeText={setLinkUrl}
          placeholder="https://..."
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Section>

      <Section title="설명" subtitle="사용자에게 보여줄 이벤트 설명을 작성해요.">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="이벤트 설명"
          placeholderTextColor="#AAAAAA"
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.multiline]}
        />
      </Section>

      <Section title="이미지" subtitle="배너에 노출할 이미지 URL을 입력하면 미리보기가 표시돼요.">
        <TextInput
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          placeholderTextColor="#AAAAAA"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {imagePreview && isUrl(imagePreview) ? (
          <Image source={{ uri: imagePreview }} style={styles.preview} contentFit="cover" />
        ) : (
          <View style={styles.previewEmpty}>
            <Text style={styles.previewEmptyText}>이미지 미리보기</Text>
          </View>
        )}
      </Section>

      <Section title="기간" subtitle="노출 시작·종료 일시를 설정해요.">
        <DateField label="시작 일시 *" value={startsAt} field="start" onOpen={setPicker} />
        <DateField label="종료 일시 *" value={endsAt} field="end" onOpen={setPicker} />
      </Section>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.label}>활성 상태</Text>
          <Text style={styles.help}>노출할 이벤트이면 켜 주세요.</Text>
        </View>
        <Switch value={active} onValueChange={setActive} />
      </View>

      {picker ? (
        <DateTimePicker
          value={pickerValue}
          mode={picker.mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={changeDate}
        />
      ) : null}
    </AdminEditorScaffold>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };
function Field({ label, multiline, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multiline]}
        placeholderTextColor="#AAAAAA"
      />
    </View>
  );
}

function DateField({
  label,
  value,
  field,
  onOpen,
}: {
  label: string;
  value: Date;
  field: Picker['field'];
  onOpen: (value: Picker) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateRow}>
        <Pressable style={styles.dateButton} onPress={() => onOpen({ field, mode: 'date' })}>
          <Ionicons name="calendar-outline" size={18} color="#555555" />
          <Text style={styles.dateText}>{formatDate(value)}</Text>
        </Pressable>
        <Pressable style={styles.dateButton} onPress={() => onOpen({ field, mode: 'time' })}>
          <Ionicons name="time-outline" size={18} color="#555555" />
          <Text style={styles.dateText}>{formatTime(value)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminEventEditorScreen() {
  return (
    <AdminRouteGuard>
      <Content />
    </AdminRouteGuard>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#777777',
    marginBottom: 2,
  },
  sectionBody: {
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  field: {
    gap: 0,
  },
  label: { fontSize: 14, fontWeight: '700', color: '#333333', marginBottom: 8 },
  input: {
    height: 50,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    color: '#222222',
  },
  multiline: { height: undefined, minHeight: 120, paddingTop: 12, paddingBottom: 12 },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#EEEEEE',
  },
  previewEmpty: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  previewEmptyText: {
    fontSize: 12,
    color: '#999999',
  },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FAFAFA',
  },
  dateText: { fontSize: 13, color: '#333333' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E4',
  },
  switchText: { flex: 1 },
  help: { fontSize: 12, color: '#777777', marginTop: 4 },
});
