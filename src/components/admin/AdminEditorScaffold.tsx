import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/src/components/ui/KeyboardAwareScrollView';

type Props = {
  title: string;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveDisabled?: boolean;
  onBack: () => void;
  onSave: () => void;
  children: ReactNode;
};

export function AdminEditorScaffold({
  title,
  loading,
  error,
  saving,
  saveDisabled,
  onBack,
  onSave,
  children,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2C8C55" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={onBack}>
            <Text style={styles.retryText}>목록으로</Text>
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
            {children}
          </KeyboardAwareScrollView>
          <View style={styles.bottom}>
            <Pressable
              style={[styles.saveButton, (saveDisabled || saving) && styles.disabled]}
              disabled={saveDisabled || saving}
              onPress={onSave}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>저장</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#222222' },
  headerSpacer: { width: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  error: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: '#C83E3E' },
  retry: { borderRadius: 9, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#2C8C55' },
  retryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  content: { padding: 18, paddingBottom: 30, gap: 16 },
  bottom: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E4E4', backgroundColor: '#FFFFFF' },
  saveButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#2C8C55' },
  disabled: { opacity: 0.42 },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
