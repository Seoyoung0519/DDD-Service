import { Image } from 'expo-image';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import type { ReadingSessionCameraFrame } from '@/src/constants/readingSessionCameraFrames';

export type CameraFramePreviewHandle = {
  captureComposite: () => Promise<string>;
};

type CameraFramePreviewProps = {
  frame: ReadingSessionCameraFrame;
  photoUri?: string | null;
  width?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  /** 프레임 선택 UI — 카메라 외곽 테두리 */
  selected?: boolean;
  selectionColor?: string;
};

async function captureViewToImage(viewRef: React.RefObject<View | null>): Promise<string> {
  if (!viewRef.current) {
    throw new Error('프레임 미리보기를 캡처할 수 없습니다.');
  }

  return captureRef(viewRef, {
    format: 'jpg',
    quality: 0.92,
    result: 'tmpfile',
  });
}

export const CameraFramePreview = forwardRef<CameraFramePreviewHandle, CameraFramePreviewProps>(
  function CameraFramePreview(
    { frame, photoUri, width = '72%', style, loading = false, selected = false, selectionColor = '#2C8C55' },
    ref,
  ) {
    const { photoInset, photoBorderRadiusRatio = 0.04 } = frame;
    const captureRootRef = useRef<View>(null);
    const [slotWidth, setSlotWidth] = useState(0);

    useImperativeHandle(ref, () => ({
      captureComposite: () => captureViewToImage(captureRootRef),
    }));

    const onPhotoSlotLayout = (event: LayoutChangeEvent) => {
      const nextWidth = event.nativeEvent.layout.width;
      if (nextWidth > 0 && nextWidth !== slotWidth) {
        setSlotWidth(nextWidth);
      }
    };

    const photoBorderRadius =
      slotWidth > 0 ? Math.max(4, slotWidth * photoBorderRadiusRatio) : 6;

    return (
      <View
        style={[
          styles.outer,
          { width },
          selected && {
            borderColor: selectionColor,
            borderWidth: 3,
            borderRadius: 14,
          },
        ]}>
        <View
          ref={captureRootRef}
          collapsable={false}
          style={[styles.root, { aspectRatio: frame.aspectRatio }, style]}>
          <View
            onLayout={onPhotoSlotLayout}
            style={[
              styles.photoSlot,
              {
                left: `${photoInset.left * 100}%`,
                top: `${photoInset.top * 100}%`,
                width: `${photoInset.width * 100}%`,
                height: `${photoInset.height * 100}%`,
                borderRadius: photoBorderRadius,
              },
            ]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
            ) : loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color="#2C8C55" />
              </View>
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>
          <Image
            source={frame.overlay}
            style={styles.overlay}
            contentFit="fill"
            pointerEvents="none"
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    padding: 2,
    overflow: 'hidden',
  },
  root: {
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  photoSlot: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    zIndex: 0,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
});
