import type { ImageSourcePropType } from 'react-native';

/** 장르 스티커 (1)~(18) — 개별 PNG, order 번호와 1:1 매핑 */
const STICKER_IMAGES: Record<number, ImageSourcePropType> = {
  1: require('../../assets/images/daedokDictionary/stickers/01.png'),
  2: require('../../assets/images/daedokDictionary/stickers/02.png'),
  3: require('../../assets/images/daedokDictionary/stickers/03.png'),
  4: require('../../assets/images/daedokDictionary/stickers/04.png'),
  5: require('../../assets/images/daedokDictionary/stickers/05.png'),
  6: require('../../assets/images/daedokDictionary/stickers/06.png'),
  7: require('../../assets/images/daedokDictionary/stickers/07.png'),
  8: require('../../assets/images/daedokDictionary/stickers/08.png'),
  9: require('../../assets/images/daedokDictionary/stickers/09.png'),
  10: require('../../assets/images/daedokDictionary/stickers/10.png'),
  11: require('../../assets/images/daedokDictionary/stickers/11.png'),
  12: require('../../assets/images/daedokDictionary/stickers/12.png'),
  13: require('../../assets/images/daedokDictionary/stickers/13.png'),
  14: require('../../assets/images/daedokDictionary/stickers/14.png'),
  15: require('../../assets/images/daedokDictionary/stickers/15.png'),
  16: require('../../assets/images/daedokDictionary/stickers/16.png'),
  17: require('../../assets/images/daedokDictionary/stickers/17.png'),
  18: require('../../assets/images/daedokDictionary/stickers/18.png'),
};

export function getDaedokDictionaryStickerImage(order: number): ImageSourcePropType | undefined {
  return STICKER_IMAGES[order];
}
