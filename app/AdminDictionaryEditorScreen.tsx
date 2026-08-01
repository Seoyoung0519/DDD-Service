import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import {
  createAdminDictionaryEntry,
  fetchAdminDictionaryEntry,
  updateAdminDictionaryEntry,
} from '@/src/api/adminDictionary';
import { AdminEditorScaffold } from '@/src/components/admin/AdminEditorScaffold';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

function Content() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [category, setCategory] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void (async () => {
      try {
        const item = await fetchAdminDictionaryEntry(id);
        if (!mounted) return;
        setTerm(item.term);
        setDefinition(item.definition);
        setCategory(item.category ?? '');
        setPublished(item.is_published);
      } catch (reason) {
        if (mounted) setError(reason instanceof Error ? reason.message : '항목을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const save = async () => {
    if (!term.trim() || !definition.trim()) {
      Alert.alert('입력 확인', '용어와 정의를 모두 입력해 주세요.');
      return;
    }
    const payload = {
      term: term.trim(),
      definition: definition.trim(),
      category: category.trim() || null,
      is_published: published,
    };
    setSaving(true);
    try {
      if (id) await updateAdminDictionaryEntry(id, payload);
      else await createAdminDictionaryEntry(payload);
      router.replace('/AdminDictionaryManagementScreen');
    } catch (reason) {
      Alert.alert('저장 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminEditorScaffold
      title={id ? '대독사전 편집' : '대독사전 등록'}
      loading={loading}
      error={error}
      saving={saving}
      saveDisabled={!term.trim() || !definition.trim()}
      onBack={() => router.replace('/AdminDictionaryManagementScreen')}
      onSave={() => void save()}>
      <View><Text style={styles.label}>용어 *</Text><TextInput style={styles.input} value={term} onChangeText={setTerm} placeholder="용어를 입력해 주세요." placeholderTextColor="#AAAAAA" /></View>
      <View><Text style={styles.label}>정의 *</Text><TextInput style={[styles.input, styles.definition]} value={definition} onChangeText={setDefinition} placeholder="정의를 입력해 주세요." placeholderTextColor="#AAAAAA" multiline textAlignVertical="top" /></View>
      <View><Text style={styles.label}>카테고리</Text><TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="예: 용어" placeholderTextColor="#AAAAAA" /></View>
      <View style={styles.switchRow}>
        <View style={styles.switchText}><Text style={styles.label}>게시 상태</Text><Text style={styles.help}>사용자에게 공개할 항목이면 켜 주세요.</Text></View>
        <Switch value={published} onValueChange={setPublished} />
      </View>
    </AdminEditorScaffold>
  );
}

export default function AdminDictionaryEditorScreen() {
  return <AdminRouteGuard><Content /></AdminRouteGuard>;
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '700', color: '#333333', marginBottom: 8 },
  input: { height: 50, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: '#DDDDDD', backgroundColor: '#FFFFFF', fontSize: 14, color: '#222222' },
  definition: { minHeight: 180, paddingTop: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E4' },
  switchText: { flex: 1 },
  help: { fontSize: 12, color: '#777777' },
});
