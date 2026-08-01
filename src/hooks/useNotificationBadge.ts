import { useCallback, useEffect, useState } from 'react';

import {
  getUnreadNotificationCount,
  subscribeNotificationInbox,
} from '@/src/services/push/notificationInbox';

export function formatNotificationBadgeCount(count: number): string {
  if (count > 99) return '99+';
  if (count > 9) return '9+';
  return String(count);
}

export function useNotificationBadge(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const n = await getUnreadNotificationCount();
    setCount(n);
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeNotificationInbox(() => {
      void refresh();
    });
  }, [refresh]);

  return count;
}
