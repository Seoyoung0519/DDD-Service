import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';

import {
  createAdminPick,
  fetchAdminPick,
  updateAdminPick,
  type CreateAdminPickInput,
} from '@/src/api/adminPicks';
import { AdminEditorScaffold } from '@/src/components/admin/AdminEditorScaffold';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

function Content() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isbn, setIsbn] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void (async () => {
      try {
        const item = await fetchAdminPick(id);
        if (!mounted) return;
        setTitle(item.title);
        setDescription(item.description ?? '');
        setIsbn(item.book_isbn ?? '');
        setCoverUrl(item.cover_image_url ?? '');
        setSortOrder(String(item.sort_order));
        setActive(item.is_active);
      } catch (reason) {
        if (mounted) setError(reason instanceof Error ? reason.message : '항목을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const save = async () => {
    const order = Number(sortOrder);
    if (!title.trim()) return Alert.alert('입력 확인', '제목을 입력해 주세요.');
    if (!Number.isInteger(order)) return Alert.alert('입력 확인', '정렬 순서는 정수로 입력해 주세요.');
    if (coverUrl.trim() && !/^https?:\/\/\S+$/i.test(coverUrl.trim())) {
      return Alert.alert('입력 확인', '커버 이미지 URL을 확인해 주세요.');
    }
    const payload: CreateAdminPickInput = {
      title: title.trim(),
      description: description.trim() || null,
      book_isbn: isbn.trim() || null,
      cover_image_url: coverUrl.trim() || null,
      sort_order: order,
      is_active: active,
    };
    setSaving(true);
    try {
      if (id) await updateAdminPick(id, payload);
      else await createAdminPick(payload);
      router.replace('/AdminPickManagementScreen');
    } catch (reason) {
      Alert.alert('저장 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const coverPreview = coverUrl.trim();

  return (
    <AdminEditorScaffold
      title={id ? '대독 Pick 편집' : '대독 Pick 등록'}
      loading={loading}
      error={error}
      saving={saving}
      saveDisabled={!title.trim()}
      onBack={() => router.replace('/AdminPickManagementScreen')}
      onSave={() => void save()}>
      <Section title="기본 정보" subtitle="추천 콘텐츠의 제목과 도서 정보를 입력해요.">
        <Field label="제목 *" value={title} onChangeText={setTitle} placeholder="추천 콘텐츠 제목" />
        <Field label="도서 ISBN" value={isbn} onChangeText={setIsbn} placeholder="978..." />
        <Field
          label="정렬 순서"
          value={sortOrder}
          onChangeText={setSortOrder}
          placeholder="0"
          keyboardType="number-pad"
        />
      </Section>

      <Section title="설명" subtitle="사용자 화면에 노출될 추천 설명을 작성해요.">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="추천 설명"
          placeholderTextColor="#AAAAAA"
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.multiline]}
        />
      </Section>

      <Section title="커버 이미지" subtitle="표지 이미지 URL을 입력하면 미리보기가 표시돼요.">
        <TextInput
          value={coverUrl}
          onChangeText={setCoverUrl}
          placeholder="https://..."
          placeholderTextColor="#AAAAAA"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {coverPreview && /^https?:\/\/\S+$/i.test(coverPreview) ? (
          <Image source={{ uri: coverPreview }} style={styles.preview} contentFit="cover" />
        ) : (
          <View style={styles.previewEmpty}>
            <Text style={styles.previewEmptyText}>이미지 미리보기</Text>
          </View>
        )}
      </Section>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.label}>활성 상태</Text>
          <Text style={styles.help}>사용할 추천 항목이면 켜 주세요.</Text>
        </View>
        <Switch value={active} onValueChange={setActive} />
      </View>
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

export default function AdminPickEditorScreen() {
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
    height: 180,
    borderRadius: 12,
    backgroundColor: '#EEEEEE',
  },
  previewEmpty: {
    width: '100%',
    height: 120,
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
