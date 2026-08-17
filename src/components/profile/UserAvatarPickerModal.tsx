import { Image } from 'expo-image';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { APP_FONTS } from '@/src/theme/fonts';

import {
  getUserAvatarList,
  getUserAvatarSource,
  type UserAvatarId,
} from '@/src/constants/userAvatars';

const AVATAR_LIST = getUserAvatarList();

const COLORS = {
  PRIMARY: '#2C8C55',
  TEXT: '#333333',
  SUBTITLE: '#777777',
  OVERLAY: 'rgba(0,0,0,0.45)',
  SHEET: '#FFFFFF',
  BORDER: '#E8E8E8',
};

const FONTS = APP_FONTS;

type UserAvatarPickerModalProps = {
  visible: boolean;
  selectedId: UserAvatarId;
  onSelect: (id: UserAvatarId) => void;
  onClose: () => void;
};

export function UserAvatarPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: UserAvatarPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>캐릭터 선택</Text>
          <Text style={styles.subtitle}>프로필로 사용할 캐릭터를 골라주세요</Text>

          <View style={styles.previewWrap}>
            <Image
              source={getUserAvatarSource(selectedId)}
              style={styles.preview}
              contentFit="cover"
            />
          </View>

          <View style={styles.grid}>
            {AVATAR_LIST.map((item) => {
              const selected = selectedId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelect(item.id)}
                  style={[styles.cell, selected && styles.cellSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <Image source={item.source} style={styles.thumb} contentFit="cover" />
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.doneBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.doneBtnText}>완료</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: COLORS.SHEET,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 17,
    color: COLORS.TEXT,
    fontFamily: FONTS.BOLD,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.SUBTITLE,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
  },
  previewWrap: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.BORDER,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellSelected: {
    borderColor: COLORS.PRIMARY,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  doneBtn: {
    marginTop: 18,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: FONTS.BOLD,
  },
});
