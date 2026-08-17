import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

type AnchoredReportMenuProps = {
  label: string;
  popupWidth: number;
  placement: 'left-below' | 'below';
  verticalOffset: number;
  triggerStyle?: StyleProp<ViewStyle>;
  triggerLabel: string;
  children: ReactNode;
  onPressReport: () => void;
};

function AnchoredReportMenu({
  label,
  popupWidth,
  placement,
  verticalOffset,
  triggerStyle,
  triggerLabel,
  children,
  onPressReport,
}: AnchoredReportMenuProps) {
  const anchorRef = useRef<View>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);

  const openMenu = () => {
    anchorRef.current?.measureInWindow((x, y, _width, height) => {
      setPopupPosition({
        left: Math.max(10, placement === 'left-below' ? x - popupWidth + 30 : x),
        top: Math.max(10, y + height + verticalOffset),
      });
    });
  };

  const selectReport = () => {
    setPopupPosition(null);
    onPressReport();
  };

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <Pressable
          style={triggerStyle}
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel={triggerLabel}>
          {children}
        </Pressable>
      </View>
      <Modal
        visible={popupPosition != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPopupPosition(null)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setPopupPosition(null)}>
          {popupPosition ? (
            <Pressable
              style={[styles.popup, { width: popupWidth }, popupPosition]}
              onPress={selectReport}
              accessibilityRole="button"
              accessibilityLabel={label}>
              <Text
                style={styles.popupText}
                numberOfLines={1}
                allowFontScaling
                maxFontSizeMultiplier={1.2}>
                {label}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

type FeedReportMenuButtonProps = {
  onPressReport: () => void;
  iconSize?: number;
};

export function FeedReportMenuButton({
  onPressReport,
  iconSize = 22,
}: FeedReportMenuButtonProps) {
  return (
    <AnchoredReportMenu
      label="피드 신고하기"
      popupWidth={140}
      placement="left-below"
      verticalOffset={30}
      triggerStyle={styles.moreButton}
      triggerLabel="피드 신고 메뉴"
      onPressReport={onPressReport}>
      <Ionicons name="ellipsis-vertical" size={iconSize} color="#666666" />
    </AnchoredReportMenu>
  );
}

type UserReportMenuButtonProps = {
  children: ReactNode;
  triggerStyle: StyleProp<ViewStyle>;
  userName: string;
  onPressReport: () => void;
};

export function UserReportMenuButton({
  children,
  triggerStyle,
  userName,
  onPressReport,
}: UserReportMenuButtonProps) {
  return (
    <AnchoredReportMenu
      label="프로필 신고하기"
      popupWidth={148}
      placement="below"
      verticalOffset={30}
      triggerStyle={triggerStyle}
      triggerLabel={`${userName} 사용자 신고 메뉴`}
      onPressReport={onPressReport}>
      {children}
    </AnchoredReportMenu>
  );
}

const styles = StyleSheet.create({
  moreButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    position: 'absolute',
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E1E1E1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 6,
  },
  popupText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C83E3E',
    flexShrink: 0,
    includeFontPadding: false,
  },
});
