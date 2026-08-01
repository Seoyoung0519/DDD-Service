/** stickers.png(768×1024) 4열 콜라주 — 넓은 지그재그·회전 */
export type StickerLayoutSlot = {
  left: number;
  top: number;
  width: number;
  height: number;
  /** 시계 방향 회전(도) */
  rotate?: number;
};

/** 세로 여유를 조금 더 줘 흩어진 배치가 잘리지 않게 */
export const STICKER_SHEET_ASPECT = 768 / 1140;

export const DAEDOK_DICTIONARY_STICKER_LAYOUT: Record<number, StickerLayoutSlot> = {
  // row 1
  1: { left: -2.0, top: 0.0, width: 24.0, height: 17.5, rotate: -4.5 },
  2: { left: 24.5, top: -3.8, width: 25.0, height: 17.5, rotate: 5 },
  3: { left: 53.0, top: 0.5, width: 24.5, height: 18.0, rotate: -3.5 },
  4: { left: 77.0, top: -1.8, width: 24.0, height: 17.5, rotate: 4.5 },
  // row 2
  5: { left: -1.2, top: 19.0, width: 22.5, height: 17.5, rotate: 4 },
  6: { left: 24.0, top: 18.0, width: 23.5, height: 18.0, rotate: -5.5 },
  7: { left: 48.5, top: 21.2, width: 25.0, height: 17.5, rotate: 4.5 },
  8: { left: 71.5, top: 16.8, width: 25.0, height: 17.5, rotate: -3.5 },
  // row 3
  9: { left: 0.0, top: 38.5, width: 23.5, height: 17.5, rotate: -5 },
  10: { left: 23.0, top: 40.5, width: 26.0, height: 19.0, rotate: 5.5 },
  11: { left: 51.5, top: 39.8, width: 24.5, height: 17.5, rotate: -4 },
  12: { left: 75.0, top: 36.5, width: 24.0, height: 18.0, rotate: 4.5 },
  // row 4
  13: { left: 1.0, top: 60.5, width: 21.5, height: 17.5, rotate: 5 },
  14: { left: 27.0, top: 62.5, width: 22.5, height: 18.0, rotate: -4.5 },
  15: { left: 52.0, top: 63.8, width: 24.5, height: 17.5, rotate: 4 },
  16: { left: 76.5, top: 60.0, width: 24.0, height: 17.5, rotate: -5.5 },
  // row 5
  17: { left: 12.0, top: 79.5, width: 25.0, height: 18.0, rotate: -4 },
  18: { left: 54.5, top: 83.8, width: 25.0, height: 18.0, rotate: 5 },
};

export function getDaedokDictionaryStickerLayout(order: number): StickerLayoutSlot | undefined {
  return DAEDOK_DICTIONARY_STICKER_LAYOUT[order];
}
