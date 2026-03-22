import { Image as ExpoImage } from 'expo-image';
import * as Linking from 'expo-linking';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { BookPickVideoItem } from './types';

type Props = {
  item: BookPickVideoItem;
};

function BookPickVideoCardImpl({ item }: Props) {
  const handlePress = async () => {
    if (!item.externalUrl) return;
    try {
      await Linking.openURL(item.externalUrl);
    } catch (e) {
      console.error('[BookPickVideoCard] openURL failed:', e);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.thumbWrap}>
        <ExpoImage source={{ uri: item.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
        <View style={styles.durationPill}>
          <Text style={styles.durationText} numberOfLines={1}>
            {item.duration}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.channelName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export const BookPickVideoCard = memo(BookPickVideoCardImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  thumbWrap: {
    width: 100,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#DDD',
    marginRight: 12,
    justifyContent: 'flex-end',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  durationPill: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    lineHeight: 18,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    color: '#777777',
    lineHeight: 16,
  },
});

