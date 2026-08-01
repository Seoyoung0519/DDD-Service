import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createAdminInquiry } from '@/src/api/inquiries';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

function AdminInquiryEditorContent() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const cleanUserId = userId.trim();
    const cleanSubject = subject.trim();
    const cleanContent = content.trim();
    if (!cleanUserId || !cleanSubject || !cleanContent) {
      Alert.alert('입력 확인', '사용자 ID, 문의 제목과 내용을 모두 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const created = await createAdminInquiry({
        user_id: cleanUserId,
        subject: cleanSubject,
        content: cleanContent,
      });
      router.replace({
        pathname: '/AdminInquiryDetailScreen',
        params: { id: created.id },
      });
    } catch (reason) {
      Alert.alert('등록 실패', reason instanceof Error ? reason.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/AdminInquiryManagementScreen')} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>문의 수동 등록</Text>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.description}>사용자를 대신하여 문의를 등록합니다.</Text>
          <Text style={styles.label}>사용자 ID *</Text>
          <TextInput
            style={styles.input}
            value={userId}
            onChangeText={setUserId}
            placeholder="user UUID"
            placeholderTextColor="#AAAAAA"
            autoCapitalize="none"
          />
          <Text style={styles.label}>문의 제목 *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="문의 제목"
            placeholderTextColor="#AAAAAA"
            maxLength={100}
          />
          <Text style={styles.label}>문의 내용 *</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            value={content}
            onChangeText={setContent}
            placeholder="문의 내용"
            placeholderTextColor="#AAAAAA"
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
        </ScrollView>
        <View style={styles.bottom}>
          <Pressable style={styles.saveButton} disabled={saving} onPress={() => void save()}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>문의 등록</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function AdminInquiryEditorScreen() {
  return (
    <AdminRouteGuard>
      <AdminInquiryEditorContent />
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
  content: { padding: 18, paddingBottom: 28 },
  description: { fontSize: 13, color: '#666666', marginBottom: 7 },
  label: { fontSize: 13, fontWeight: '700', color: '#444444', marginTop: 16, marginBottom: 8 },
  input: {
    height: 49,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#222222',
  },
  contentInput: { height: 190, paddingVertical: 12 },
  bottom: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  saveButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#2C8C55' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
