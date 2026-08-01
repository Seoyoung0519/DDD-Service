import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getDaedokDictionaryStickerImage } from '@/src/constants/daedokDictionaryStickerImages';
import {
  getDaedokDictionaryStickerLayout,
  STICKER_SHEET_ASPECT,
} from '@/src/constants/daedokDictionaryStickerLayout';
import type { DaedokDictionaryGenre } from '@/src/constants/daedokDictionaryGenres';

type Props = {
  genres: DaedokDictionaryGenre[];
  onPressGenre: (genre: DaedokDictionaryGenre) => void;
};

export function DaedokDictionaryStickerGrid({ genres, onPressGenre }: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.canvas}>
        {genres.map((genre) => {
          const slot = getDaedokDictionaryStickerLayout(genre.order);
          const source = getDaedokDictionaryStickerImage(genre.order);
          if (!slot || !source) return null;

          return (
            <Pressable
              key={genre.id}
              style={[
                styles.stickerSlot,
                {
                  left: `${slot.left}%`,
                  top: `${slot.top}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                  transform: slot.rotate ? [{ rotate: `${slot.rotate}deg` }] : undefined,
                },
              ]}
              onPress={() => onPressGenre(genre)}
              accessibilityRole="button"
              accessibilityLabel={`${genre.label} 장르`}>
              <Image source={source} style={styles.stickerImage} contentFit="contain" />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingBottom: 16,
  },
  canvas: {
    width: '100%',
    aspectRatio: STICKER_SHEET_ASPECT,
    position: 'relative',
    overflow: 'visible',
  },
  stickerSlot: {
    position: 'absolute',
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
});
