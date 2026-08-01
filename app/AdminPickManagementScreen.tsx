import { useRouter } from 'expo-router';
import React from 'react';

import {
  deleteAdminPick,
  fetchAdminPicks,
  type AdminPick,
} from '@/src/api/adminPicks';
import { AdminResourceList } from '@/src/components/admin/AdminResourceList';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

function Content() {
  const router = useRouter();
  return (
    <AdminResourceList<AdminPick>
      title="대독 Pick 관리"
      description="추천 도서 콘텐츠의 노출 순서와 활성 상태를 관리합니다."
      emptyText="등록된 대독 Pick이 없습니다."
      loadItems={fetchAdminPicks}
      deleteItem={deleteAdminPick}
      getTitle={(item) => item.title}
      getSubtitle={(item) =>
        [item.book_isbn ? `ISBN ${item.book_isbn}` : null, `정렬 ${item.sort_order}`]
          .filter(Boolean)
          .join(' · ')
      }
      getStatus={(item) => ({ label: item.is_active ? '활성' : '비활성', active: item.is_active })}
      onBack={() => router.replace('/AdminDashboardScreen')}
      onCreate={() => router.push('/AdminPickEditorScreen')}
      onOpen={(item) =>
        router.push({ pathname: '/AdminPickEditorScreen', params: { id: item.id } })
      }
    />
  );
}

export default function AdminPickManagementScreen() {
  return <AdminRouteGuard><Content /></AdminRouteGuard>;
}
