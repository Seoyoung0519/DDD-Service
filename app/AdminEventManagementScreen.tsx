import { useRouter } from 'expo-router';
import React from 'react';

import {
  deleteAdminEvent,
  fetchAdminEvents,
  type AdminEvent,
} from '@/src/api/adminEvents';
import { AdminResourceList } from '@/src/components/admin/AdminResourceList';
import { AdminRouteGuard } from '@/src/components/admin/AdminRouteGuard';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ko-KR');
}

function Content() {
  const router = useRouter();
  return (
    <AdminResourceList<AdminEvent>
      title="이벤트 관리"
      description="앱 이벤트의 기간과 노출 상태를 관리합니다."
      emptyText="등록된 이벤트가 없습니다."
      loadItems={fetchAdminEvents}
      deleteItem={deleteAdminEvent}
      getTitle={(item) => item.title}
      getSubtitle={(item) => `${formatDate(item.starts_at)} ~ ${formatDate(item.ends_at)}`}
      getStatus={(item) => ({ label: item.is_active ? '활성' : '비활성', active: item.is_active })}
      onBack={() => router.replace('/AdminDashboardScreen')}
      onCreate={() => router.push('/AdminEventEditorScreen')}
      onOpen={(item) =>
        router.push({ pathname: '/AdminEventEditorScreen', params: { id: item.id } })
      }
    />
  );
}

export default function AdminEventManagementScreen() {
  return <AdminRouteGuard><Content /></AdminRouteGuard>;
}
