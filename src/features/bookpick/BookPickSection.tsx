import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { BookPickSection as BookPickSectionType } from './types';
import { BookPickVideoCard } from './BookPickVideoCard';

type Props = {
  section: BookPickSectionType;
};

export function BookPickSection({ section }: Props) {
  const router = useRouter();
  const PREVIEW_COUNT = 4;
  const visibleItems = section.items.slice(0, PREVIEW_COUNT);
  const canShowMore = section.items.length > PREVIEW_COUNT;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>

      {section.items.length === 0 ? (
        <Text style={styles.emptyText}>영상이 없습니다.</Text>
      ) : (
        <View>
          {visibleItems.map((item) => (
            <BookPickVideoCard key={item.videoId} item={item} />
          ))}
        </View>
      )}

      {canShowMore && (
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() =>
            router.push({
              pathname: '/BookPickAll',
              params: { playlistId: section.playlistId },
            })
          }
          activeOpacity={0.85}>
          <Text style={styles.moreButtonText}>더보기</Text>
          <Ionicons name="chevron-forward" size={18} color="#666" style={styles.moreChevron} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#777777',
    paddingVertical: 10,
  },
  moreButton: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  moreChevron: {
    marginLeft: 6,
  },
});

