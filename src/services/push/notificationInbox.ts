import AsyncStorage from '@react-native-async-storage/async-storage';

import { COMMUTE_ALERT_NOTIFICATION } from '@/src/constants/pushNotifications';

const INBOX_KEY = '@daedokdan_notification_inbox_v1';

export type InboxNotification = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
  read: boolean;
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function isLegacyCommuteProximityItem(item: InboxNotification): boolean {
  const title = item.title.trim();
  const body = item.body.trim();
  return (
    title === COMMUTE_ALERT_NOTIFICATION.transferTitle ||
    title === COMMUTE_ALERT_NOTIFICATION.destinationTitle ||
    body.includes('환승을 준비해 주세요') ||
    body.includes('도보로 이동해 주세요') ||
    body.includes('도보 이동') ||
    body.includes('도착지 근처입니다')
  );
}

async function readInbox(): Promise<InboxNotification[]> {
  const raw = await AsyncStorage.getItem(INBOX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as InboxNotification[];
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter((item) => !isLegacyCommuteProximityItem(item));
    if (filtered.length !== parsed.length) {
      await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

async function writeInbox(items: InboxNotification[]): Promise<void> {
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(items));
  notifyListeners();
}

export function subscribeNotificationInbox(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getNotificationInbox(): Promise<InboxNotification[]> {
  const items = await readInbox();
  return items.sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  );
}

export async function getUnreadNotificationCount(): Promise<number> {
  const items = await readInbox();
  return items.filter((n) => !n.read).length;
}

export async function addNotificationToInbox(
  input: Pick<InboxNotification, 'title' | 'body'> & { receivedAt?: string },
): Promise<InboxNotification> {
  const items = await readInbox();
  const entry: InboxNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: input.body,
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    read: false,
  };
  await writeInbox([entry, ...items].slice(0, 100));
  return entry;
}

export async function markAllNotificationsRead(): Promise<void> {
  const items = await readInbox();
  await writeInbox(items.map((n) => ({ ...n, read: true })));
}

export async function markNotificationRead(id: string): Promise<void> {
  const items = await readInbox();
  await writeInbox(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export async function clearNotificationInbox(): Promise<void> {
  await AsyncStorage.removeItem(INBOX_KEY);
}
