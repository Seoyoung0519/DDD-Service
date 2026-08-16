import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';

import { createInquiry } from '@/src/api/inquiries';

export default function SettingsInquiryEditorScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const cleanSubject = subject.trim();
    const cleanContent = content.trim();
    if (!cleanSubject || !cleanContent) {
      Alert.alert('입력 확인', '문의 제목과 내용을 모두 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const created = await createInquiry({ subject: cleanSubject, content: cleanContent });
      router.replace({
        pathname: '/SettingsInquiryDetailScreen',
        params: { id: created.id },
      });
    } catch (reason) {
      Alert.alert('문의 등록 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <View style={styles.headerCenter} />
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <KeyboardAwareScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={20} color="#2C8C55" />
            <Text style={styles.noticeText}>
              문의가 접수되면 관리자 답변을 이 화면의 문의 목록에서 확인할 수 있어요.
            </Text>
          </View>
          <Text style={styles.label}>문의 제목 *</Text>
          <TextInput
            style={styles.subjectInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="문의 제목을 입력해 주세요."
            placeholderTextColor="#AAAAAA"
            maxLength={100}
          />
          <Text style={styles.counter}>{subject.length}/100</Text>

          <Text style={styles.label}>문의 내용 *</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="궁금한 점이나 불편한 내용을 자세히 작성해 주세요."
            placeholderTextColor="#AAAAAA"
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{content.length}/2000</Text>
        </KeyboardAwareScrollView>
        <View style={styles.bottom}>
          <Pressable
            style={[styles.saveButton, (!subject.trim() || !content.trim() || saving) && styles.disabled]}
            disabled={!subject.trim() || !content.trim() || saving}
            onPress={() => void save()}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>문의 등록</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  headerCenter: { flex: 1 },
  headerSpacer: { width: 28 },
  content: { padding: 18, paddingBottom: 28 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#EAF5EF',
    marginBottom: 8,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#3E6A50' },
  label: { fontSize: 14, fontWeight: '700', color: '#333333', marginTop: 18, marginBottom: 8 },
  subjectInput: {
    height: 50,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#222222',
  },
  contentInput: {
    minHeight: 210,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    lineHeight: 21,
    color: '#222222',
  },
  counter: { alignSelf: 'flex-end', marginTop: 5, fontSize: 11, color: '#999999' },
  bottom: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  saveButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#2C8C55' },
  disabled: { opacity: 0.42 },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
