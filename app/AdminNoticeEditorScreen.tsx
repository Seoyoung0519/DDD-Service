import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createAdminNotice,
  fetchAdminNotice,
  updateAdminNotice,
} from '@/src/api/notices';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

function AdminNoticeEditorContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const editing = Boolean(id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const notice = await fetchAdminNotice(id);
        if (!active) return;
        setTitle(notice.title);
        setContent(notice.content);
        setPublished(notice.is_published);
        setPublishedAt(notice.published_at);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : '공지를 불러오지 못했습니다.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const save = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('입력 확인', '공지 제목을 입력해 주세요.');
      return;
    }
    const publishDate = published && publishedAt?.trim() ? new Date(publishedAt.trim()) : null;
    if (publishDate && Number.isNaN(publishDate.getTime())) {
      Alert.alert('입력 확인', '게시 일시는 올바른 날짜 형식으로 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: cleanTitle,
        content: content.trim(),
        is_published: published,
        published_at: published ? publishDate?.toISOString() ?? null : null,
      };
      if (id) await updateAdminNotice(id, payload);
      else await createAdminNotice(payload);
      router.replace('/AdminNoticeManagementScreen');
    } catch (reason) {
      Alert.alert('저장 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminNoticeManagementScreen')} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>{editing ? '공지 편집' : '공지 등록'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => router.replace('/AdminNoticeManagementScreen')}><Text style={styles.retryText}>목록으로</Text></Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.contentWrap} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.label}>공지 제목 *</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="공지 제목을 입력해 주세요."
                placeholderTextColor="#AAAAAA"
                maxLength={150}
              />
              <Text style={styles.counter}>{title.length}/150</Text>

              <Text style={styles.label}>공지 본문</Text>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="사용자에게 안내할 내용을 입력해 주세요."
                placeholderTextColor="#AAAAAA"
                multiline
                maxLength={5000}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{content.length}/5000</Text>
            </View>

            <View style={styles.publishCard}>
              <View style={styles.publishText}>
                <Text style={styles.publishTitle}>앱에 게시</Text>
                <Text style={styles.publishDescription}>
                  켜면 사용자 설정의 공지사항 목록에 즉시 노출됩니다.
                </Text>
              </View>
              <Switch
                value={published}
                onValueChange={(value) => {
                  setPublished(value);
                  setPublishedAt(value ? publishedAt ?? new Date().toISOString() : null);
                }}
                trackColor={{ false: '#CACACA', true: '#8BC4A4' }}
                thumbColor={published ? '#2C8C55' : '#F4F4F4'}
              />
            </View>
            {published ? (
              <View style={styles.card}>
                <Text style={styles.label}>게시 일시</Text>
                <TextInput
                  style={styles.titleInput}
                  value={publishedAt ?? ''}
                  onChangeText={setPublishedAt}
                  placeholder="2026-03-01T00:00:00.000Z"
                  placeholderTextColor="#AAAAAA"
                  autoCapitalize="none"
                />
                <Text style={styles.publishDescription}>
                  ISO 날짜 형식으로 입력해 주세요. 비워 두면 서버의 즉시 게시 기준을 사용합니다.
                </Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.bottom}>
            <Pressable
              style={[styles.saveButton, (!title.trim() || saving) && styles.disabled]}
              disabled={!title.trim() || saving}
              onPress={() => void save()}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : (
                <Text style={styles.saveText}>{published ? '저장하고 게시' : '임시 저장'}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

export default function AdminNoticeEditorScreen() {
  return (
    <AdminRouteGuard>
      <AdminNoticeEditorContent />
    </AdminRouteGuard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },
  flex: { flex: 1 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E4',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#222222' },
  headerSpacer: { width: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  error: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  contentWrap: { padding: 18, paddingBottom: 28, gap: 13 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  label: { fontSize: 14, fontWeight: '700', color: '#333333', marginBottom: 8 },
  titleInput: { height: 50, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: '#DDDDDD', backgroundColor: '#FAFAFA', fontSize: 14, color: '#222222' },
  contentInput: { minHeight: 245, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: '#DDDDDD', backgroundColor: '#FAFAFA', fontSize: 14, lineHeight: 21, color: '#222222' },
  counter: { alignSelf: 'flex-end', marginTop: 5, marginBottom: 16, fontSize: 11, color: '#999999' },
  publishCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  publishText: { flex: 1, gap: 5 },
  publishTitle: { fontSize: 15, fontWeight: '700', color: '#222222' },
  publishDescription: { fontSize: 12, lineHeight: 18, color: '#707070' },
  bottom: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  saveButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#2C8C55' },
  disabled: { opacity: 0.42 },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
