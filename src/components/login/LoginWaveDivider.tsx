import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

type PatternProps = {
  width: number;
  height: number;
  tintColor?: string;
};

export function LoginHeaderPattern({ width, height, tintColor = '#3D5C4A' }: PatternProps) {
  const dots = useMemo(
    () => [
      { cx: width * 0.12, cy: height * 0.18, r: 28, opacity: 0.05 },
      { cx: width * 0.78, cy: height * 0.12, r: 36, opacity: 0.07 },
      { cx: width * 0.9, cy: height * 0.42, r: 22, opacity: 0.06 },
      { cx: width * 0.2, cy: height * 0.55, r: 18, opacity: 0.05 },
      { cx: width * 0.62, cy: height * 0.58, r: 44, opacity: 0.07 },
    ],
    [width, height],
  );

  const squares = useMemo(
    () => [
      { left: width * 0.72, top: height * 0.26, size: 16, radius: 4, opacity: 0.07 },
      { left: width * 0.1, top: height * 0.3, size: 12, radius: 3, opacity: 0.06 },
    ],
    [width, height],
  );

  const toRgba = (opacity: number) => {
    const hex = tintColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((d, i) => (
        <View
          key={`dot-${i}`}
          style={{
            position: 'absolute',
            left: d.cx - d.r,
            top: d.cy - d.r,
            width: d.r * 2,
            height: d.r * 2,
            borderRadius: d.r,
            backgroundColor: toRgba(d.opacity),
          }}
        />
      ))}
      {squares.map((s, i) => (
        <View
          key={`sq-${i}`}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            borderRadius: s.radius,
            backgroundColor: toRgba(s.opacity),
          }}
        />
      ))}
    </View>
  );
}

