import React, { useMemo } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

const GREEN = '#2C8C55';

type Props = {
  fullText: string;
  /** 강조할 부분(사용자 입력과 동일한 접두/부분 일치) */
  query: string;
  /** 제목 등 강조 스타일 오버라이드 */
  style?: TextStyle;
};

/** 검색어와 일치하는 첫 구간만 초록색으로 표시 */
export function HighlightedSearchText({ fullText, query, style }: Props) {
  const parts = useMemo(() => splitHighlight(fullText, query), [fullText, query]);

  return (
    <Text
      style={[styles.base, style]}
      numberOfLines={1}
      ellipsizeMode="tail">
      {parts.map((p, i) => (
        <Text key={i} style={p.highlight ? styles.hit : undefined}>
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

function splitHighlight(
  text: string,
  query: string,
): { text: string; highlight: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, highlight: false }];

  const lower = text.toLocaleLowerCase();
  const qq = q.toLocaleLowerCase();
  const idx = lower.indexOf(qq);
  if (idx < 0) return [{ text, highlight: false }];

  const out: { text: string; highlight: boolean }[] = [];
  if (idx > 0) out.push({ text: text.slice(0, idx), highlight: false });
  out.push({ text: text.slice(idx, idx + q.length), highlight: true });
  if (idx + q.length < text.length) {
    out.push({ text: text.slice(idx + q.length), highlight: false });
  }
  return out;
}

const styles = StyleSheet.create({
  base: {
    fontSize: 14,
    color: '#222',
    minWidth: 0,
  },
  hit: {
    color: GREEN,
    fontWeight: '700',
  },
});
