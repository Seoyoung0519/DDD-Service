/**
 * 카메라 프레임 PNG의 뷰파인더 영역을 투명 처리하고 photoInset을 계산합니다.
 * 사용: node scripts/process-camera-frame-overlays.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSET_DIR = path.join(ROOT, 'assets', 'images', 'reading_session');

const FRAMES = [
  { id: '01', label: 'frame_01' },
  { id: '02', label: 'frame_02' },
  { id: '03', label: 'frame_03' },
];

function lum(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function getPixel(png, x, y) {
  const i = (y * png.width + x) << 2;
  const { data } = png;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3], l: lum(data[i], data[i + 1], data[i + 2]) };
}

function findDarkRuns(values, threshold = 45, minLen = 4) {
  const runs = [];
  let start = -1;
  for (let i = 0; i < values.length; i += 1) {
    const dark = values[i] < threshold;
    if (dark && start < 0) start = i;
    if (!dark && start >= 0) {
      if (i - start >= minLen) runs.push([start, i - 1]);
      start = -1;
    }
  }
  if (start >= 0 && values.length - start >= minLen) runs.push([start, values.length - 1]);
  return runs;
}

function bracketRuns(runs, pos) {
  let leftRun = null;
  let rightRun = null;
  for (const run of runs) {
    if (run[1] < pos) leftRun = run;
    if (run[0] > pos && !rightRun) rightRun = run;
  }
  return { leftRun, rightRun };
}

function detectHorizontalBounds(png, y) {
  const line = [];
  for (let x = 0; x < png.width; x += 1) {
    line.push(getPixel(png, x, y).l);
  }
  const runs = findDarkRuns(line);
  const cx = Math.floor(png.width / 2);
  const { leftRun, rightRun } = bracketRuns(runs, cx);
  if (!leftRun || !rightRun) return null;
  return { left: leftRun[1] + 1, right: rightRun[0] - 1 };
}

function detectVerticalBounds(png, x, cy) {
  const line = [];
  for (let y = 0; y < png.height; y += 1) {
    line.push(getPixel(png, x, y).l);
  }
  const runs = findDarkRuns(line);
  const { leftRun, rightRun } = bracketRuns(runs, cy);
  if (leftRun && rightRun) {
    const top = leftRun[1] + 1;
    const bottom = rightRun[0] - 1;
    if (bottom - top > png.height * 0.15 && bottom - top < png.height * 0.75) {
      return { top, bottom };
    }
  }

  // 밝은 뷰파인더(크림 프레임 등) — 중앙 열에서 밝은 연속 구간 탐색
  let top = null;
  let bottom = null;
  for (let y = cy; y >= 0; y -= 1) {
    if (getPixel(png, x, y).l > 225 && getPixel(png, x, y - 1).l < 120) {
      top = y;
      break;
    }
  }
  for (let y = cy; y < png.height; y += 1) {
    if (getPixel(png, x, y).l > 225 && getPixel(png, x, y + 1).l < 120) {
      bottom = y;
      break;
    }
  }
  if (top == null || bottom == null) {
    let inBright = false;
    let start = -1;
    let best = null;
    for (let y = 0; y < png.height; y += 1) {
      const bright = getPixel(png, x, y).l > 235;
      if (bright && !inBright) {
        start = y;
        inBright = true;
      }
      if (!bright && inBright) {
        const len = y - start;
        if (cy >= start && cy <= y - 1 && (!best || len > best.len)) {
          best = { top: start, bottom: y - 1, len };
        }
        inBright = false;
      }
    }
    if (best) return { top: best.top, bottom: best.bottom };
  }
  if (top != null && bottom != null) return { top, bottom };
  return null;
}

function detectViewportRect(png) {
  const cx = Math.floor(png.width / 2);
  const cy = Math.floor(png.height * 0.45);

  const horizontal = detectHorizontalBounds(png, cy);
  if (!horizontal) throw new Error('가로 뷰파인더 경계를 찾지 못했습니다.');

  const probeX = Math.min(
    png.width - 1,
    Math.max(0, Math.floor((horizontal.left + horizontal.right) / 2)),
  );
  const vertical = detectVerticalBounds(png, probeX, cy);
  if (!vertical) throw new Error('세로 뷰파인더 경계를 찾지 못했습니다.');

  return {
    left: horizontal.left,
    right: horizontal.right,
    top: vertical.top,
    bottom: vertical.bottom,
  };
}

function clearViewport(png, rect) {
  for (let y = rect.top; y <= rect.bottom; y += 1) {
    for (let x = rect.left; x <= rect.right; x += 1) {
      const i = (y * png.width + x) << 2;
      png.data[i + 3] = 0;
    }
  }
}

function toInset(rect, width, height) {
  const round = (n) => Math.round(n * 10000) / 10000;
  return {
    left: round(rect.left / width),
    top: round(rect.top / height),
    width: round((rect.right - rect.left + 1) / width),
    height: round((rect.bottom - rect.top + 1) / height),
    imageWidth: width,
    imageHeight: height,
  };
}

const results = [];

for (const frame of FRAMES) {
  const srcPath = path.join(ASSET_DIR, `camera-frame-${frame.id}.png`);
  const outPath = path.join(ASSET_DIR, `camera-frame-${frame.id}-overlay.png`);

  if (!fs.existsSync(srcPath)) {
    console.error('소스 없음:', srcPath);
    process.exit(1);
  }

  const png = PNG.sync.read(fs.readFileSync(srcPath));
  const rect = detectViewportRect(png);
  const inset = toInset(rect, png.width, png.height);
  clearViewport(png, rect);

  fs.writeFileSync(outPath, PNG.sync.write(png));
  results.push({ ...frame, inset, rect, outPath });
  console.log(frame.label, inset);
}

const tsContent = `// scripts/process-camera-frame-overlays.mjs 로 생성·갱신 — 수동 편집 시 photoInset만 맞추면 됩니다.
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
${results
  .map((r, i) => {
    const labels = ['실버', '다크 그린', '크림'];
    const radii = [0.045, 0.04, 0.038];
    const { left, top, width: w, height: h, imageWidth, imageHeight } = r.inset;
    return `  {
    id: '${r.label}',
    label: '${labels[i]}',
    overlay: require('../../assets/images/reading_session/camera-frame-${r.id}-overlay.png'),
    thumbnail: require('../../assets/images/reading_session/camera-frame-${r.id}-overlay.png'),
    photoInset: { left: ${left}, top: ${top}, width: ${w}, height: ${h} },
    photoBorderRadiusRatio: ${radii[i]},
    aspectRatio: ${imageWidth} / ${imageHeight},
  }`;
  })
  .join(',\n')}
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
`;

const constantsPath = path.join(ROOT, 'src', 'constants', 'readingSessionCameraFrames.ts');
fs.writeFileSync(constantsPath, tsContent);
console.log('Updated', constantsPath);
