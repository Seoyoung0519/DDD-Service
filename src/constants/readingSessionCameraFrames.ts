// scripts/process-camera-frame-overlays.mjs 로 생성·갱신 — 수동 편집 시 photoInset만 맞추면 됩니다.
import type { ImageSourcePropType } from 'react-native';

export type ReadingSessionCameraFrameId = 'frame_01' | 'frame_02' | 'frame_03';

export type ReadingSessionCameraFrame = {
  id: ReadingSessionCameraFrameId;
  label: string;
  overlay: ImageSourcePropType;
  thumbnail: ImageSourcePropType;
  /** 사진이 들어갈 영역 — 프레임 이미지 대비 비율(0~1) */
  photoInset: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  /** 사진 슬롯 모서리 둥글기 (슬롯 너비 대비 비율) */
  photoBorderRadiusRatio?: number;
  aspectRatio: number;
};

export const READING_SESSION_CAMERA_FRAMES: ReadingSessionCameraFrame[] = [
  {
    id: 'frame_01',
    label: '실버',
    overlay: require('../../assets/images/reading_session/camera-frame-01-overlay.png'),
    thumbnail: require('../../assets/images/reading_session/camera-frame-01-overlay.png'),
    photoInset: { left: 0.1396, top: 0.2057, width: 0.7547, height: 0.4882 },
    photoBorderRadiusRatio: 0.045,
    aspectRatio: 530 / 807,
  },
  {
    id: 'frame_02',
    label: '다크 그린',
    overlay: require('../../assets/images/reading_session/camera-frame-02-overlay.png'),
    thumbnail: require('../../assets/images/reading_session/camera-frame-02-overlay.png'),
    photoInset: { left: 0.1164, top: 0.2213, width: 0.7199, height: 0.5229 },
    photoBorderRadiusRatio: 0.04,
    aspectRatio: 507 / 809,
  },
  {
    id: 'frame_03',
    label: '크림',
    overlay: require('../../assets/images/reading_session/camera-frame-03-overlay.png'),
    thumbnail: require('../../assets/images/reading_session/camera-frame-03-overlay.png'),
    photoInset: { left: 0.0387, top: 0.2187, width: 0.8801, height: 0.5018 },
    photoBorderRadiusRatio: 0.038,
    aspectRatio: 517 / 823,
  }
];

export const DEFAULT_CAMERA_FRAME_ID: ReadingSessionCameraFrameId = 'frame_01';

export function getCameraFrameById(
  id: string | null | undefined,
): ReadingSessionCameraFrame {
  return (
    READING_SESSION_CAMERA_FRAMES.find((f) => f.id === id) ??
    READING_SESSION_CAMERA_FRAMES[0]
  );
}
