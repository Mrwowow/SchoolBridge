/**
 * src/design/Logo.tsx
 * Static SchoolBridge brand logo, ported 1:1 from the official SVG assets in
 * apps/web/public/logo-svg (same geometry: arch span + two abutments + keystone).
 *
 *   kind="mark"   → square mark only.
 *   kind="lockup" → mark + "SchoolBridge" wordmark (row).
 *   color         → 'brand' (blue + orange keystone), 'white' (reversed),
 *                   'mono' (single ink colour).
 *
 * Size is driven by `height`; the mark stays square, the lockup follows the
 * source aspect ratio (472 × 116).
 */
import React from 'react';
import { View, Text, type TextStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

type Kind = 'mark' | 'lockup';
type Color = 'brand' | 'white' | 'mono';

interface MarkColors {
  arch: string; // arch + abutments
  key: string; // keystone
}

// Exact colours from the official SVGs.
const MARK_COLORS: Record<Color, MarkColors> = {
  brand: { arch: '#2F6BFF', key: '#E0702B' },
  white: { arch: '#FFFFFF', key: '#FFB488' },
  mono: { arch: '#18233B', key: '#18233B' },
};

const WORDMARK_COLORS: Record<Color, { school: string; bridge: string }> = {
  brand: { school: '#18233B', bridge: '#2F6BFF' },
  white: { school: '#FFFFFF', bridge: '#FFFFFF' },
  mono: { school: '#18233B', bridge: '#18233B' },
};

/** The mark only — a 100×100 viewBox SVG. */
export function LogoMark({ size = 40, color = 'brand' }: { size?: number; color?: Color }) {
  const c = MARK_COLORS[color];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M22 67 C22 33 78 33 78 67" fill="none" stroke={c.arch} strokeWidth={13} strokeLinecap="round" />
      <Circle cx={22} cy={67} r={9} fill={c.arch} />
      <Circle cx={78} cy={67} r={9} fill={c.arch} />
      <Circle cx={50} cy={31} r={7} fill={c.key} />
    </Svg>
  );
}

export function Logo({
  kind = 'lockup',
  color = 'brand',
  height = 40,
}: {
  kind?: Kind;
  color?: Color;
  height?: number;
}) {
  if (kind === 'mark') {
    return <LogoMark size={height} color={color} />;
  }

  // Lockup — mark + wordmark, sized to read like the 472×116 source artwork.
  const wm = WORDMARK_COLORS[color];
  const wordSize = height * 0.52; // wordmark cap height relative to lockup height
  const base: TextStyle = { fontSize: wordSize, letterSpacing: -wordSize * 0.03 };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: height * 0.16 }}>
      <LogoMark size={height} color={color} />
      <Text style={base} numberOfLines={1}>
        <Text style={{ color: wm.school, fontWeight: '600' }}>School</Text>
        <Text style={{ color: wm.bridge, fontWeight: '800' }}>Bridge</Text>
      </Text>
    </View>
  );
}
