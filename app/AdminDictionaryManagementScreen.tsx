import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  deleteAdminDictionaryEntry,
  fetchAdminDictionary,
  type AdminDictionaryEntry,
} from '@/src/api/adminDictionary';
import { AdminResourceList } from '@/src/components/admin/AdminResourceList';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

function Content() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const loadItems = useCallback(
    () => fetchAdminDictionary(submittedQuery),
    [submittedQuery],
  );

  return (
    <AdminResourceList<AdminDictionaryEntry>
      title="대독사전 관리"
      description="대독사전의 용어와 정의, 게시 상태를 관리합니다."
      emptyText={submittedQuery ? '검색 결과가 없습니다.' : '등록된 사전 항목이 없습니다.'}
      loadItems={loadItems}
      deleteItem={deleteAdminDictionaryEntry}
      getTitle={(item) => item.term}
      getSubtitle={(item) => `${item.category || '카테고리 없음'} · ${item.definition}`}
      getStatus={(item) => ({
        label: item.is_published ? '게시' : '비공개',
        active: item.is_published,
      })}
      headerContent={
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="용어 또는 정의 검색"
            placeholderTextColor="#999999"
            returnKeyType="search"
            onSubmitEditing={() => setSubmittedQuery(query.trim())}
          />
          <Pressable style={styles.searchButton} onPress={() => setSubmittedQuery(query.trim())}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      }
      onBack={() => router.replace('/AdminDashboardScreen')}
      onCreate={() => router.push('/AdminDictionaryEditorScreen')}
      onOpen={(item) =>
        router.push({ pathname: '/AdminDictionaryEditorScreen', params: { id: item.id } })
      }
    />
  );
}

export default function AdminDictionaryManagementScreen() {
  return <AdminRouteGuard><Content /></AdminRouteGuard>;
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#222222',
  },
  searchButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#2C8C55',
  },
});
