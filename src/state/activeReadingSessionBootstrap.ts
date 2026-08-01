import type { ReadingSessionBootstrap } from '@/src/features/readingSession/types/readingSession.types';

let pending: ReadingSessionBootstrap | null = null;

export function setReadingSessionBootstrap(payload: ReadingSessionBootstrap): void {
  pending = payload;
}

export function consumeReadingSessionBootstrap(): ReadingSessionBootstrap | null {
  const out = pending;
  pending = null;
  return out;
}

export function hasPendingReadingSessionBootstrap(): boolean {
  return pending != null;
}

export function clearReadingSessionBootstrap(): void {
  pending = null;
}
