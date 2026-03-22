import type { CommutePlace } from '@/src/types/commute';

export type CommutePlacePickField = 'origin' | 'destination';

type Pending = { field: CommutePlacePickField; place: CommutePlace } | null;

let pending: Pending = null;

/** 출도착 자동완성 무효화 — 증가 시 `CommutePlaceSearchDualCard`가 즉시 후보를 비움 */
let inlineSearchGen = 0;
const inlineSearchListeners = new Set<() => void>();

export function bumpCommuteInlineSearchGen(): number {
  inlineSearchGen += 1;
  inlineSearchListeners.forEach((l) => l());
  return inlineSearchGen;
}

export function getCommuteInlineSearchGenSnapshot(): number {
  return inlineSearchGen;
}

/** `useSyncExternalStore`용 — bump 시 출도착 카드 리렌더 */
export function subscribeCommuteInlineSearchGen(onStoreChange: () => void): () => void {
  inlineSearchListeners.add(onStoreChange);
  return () => {
    inlineSearchListeners.delete(onStoreChange);
  };
}

/** 검색 결과 화면에서 선택 후 `router.back()` 직전에 호출 */
export function setCommutePlaceSelection(field: CommutePlacePickField, place: CommutePlace) {
  pending = { field, place };
  bumpCommuteInlineSearchGen();
}

/** `ReadingSession_4` 포커스 시 한 번 소비 */
export function consumeCommutePlaceSelection(): Pending {
  const out = pending;
  pending = null;
  return out;
}
