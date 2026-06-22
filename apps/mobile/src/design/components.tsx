/**
 * src/design/components.tsx
 * UI primitives ported from the mockup's ui.jsx, in React Native.
 * Card, Avatar, Chip, IconTile, Bar, SectionLabel, RatingBadge, RatingDots,
 * VoiceNote, AppHeader, RoundBtn, TabBar, Screen body helpers.
 */
import React, { useEffect, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from './Icon';
import { useTheme } from './ThemeProvider';
import { toneColors, type Theme, type Tone } from './theme';

// ── Rating map (from data.jsx RATING) ───────────────────────────────────────
export const RATING: Record<string, { v: Tone; n: number }> = {
  Excellent: { v: 'green', n: 5 },
  'Very Good': { v: 'green', n: 4 },
  Good: { v: 'primary', n: 3 },
  Fair: { v: 'amber', n: 2 },
  'Needs work': { v: 'amber', n: 2 },
  'Needs Improvement': { v: 'red', n: 1 },
};

// ── Avatar ───────────────────────────────────────────────────────────────────
/** Convert the mockup's avatar hue (0–360) to a solid HSL-derived hex. */
function hueColor(hue: number): string {
  return `hsl(${hue}, 55%, 55%)`;
}

export function Avatar({
  initials,
  hue = 255,
  size = 44,
  ring = false,
}: {
  initials: string;
  hue?: number;
  size?: number;
  ring?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: hueColor(hue),
        alignItems: 'center',
        justifyContent: 'center',
        ...(ring
          ? { borderWidth: 1.5, borderColor: theme.primary }
          : (theme.shadowSm as object)),
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
  pad = 16,
  onPress,
  flat = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pad?: number;
  onPress?: () => void;
  flat?: boolean;
}) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.surface,
    borderRadius: 22,
    padding: pad,
    borderWidth: 1,
    borderColor: flat ? theme.border : theme.border2,
    ...(flat ? {} : (theme.shadowSm as object)),
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

// ── Chip ─────────────────────────────────────────────────────────────────────
export function Chip({
  icon,
  children,
  tone = 'primary',
  style,
}: {
  icon?: string;
  children: ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const { fg, soft } = toneColors(theme, tone);
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: soft,
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 999,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={13} stroke={2.2} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '600', fontSize: 12.5 }}>{children}</Text>
    </View>
  );
}

// ── Soft icon tile ───────────────────────────────────────────────────────────
export function IconTile({ icon, tone = 'primary', size = 38 }: { icon: string; tone?: Tone; size?: number }) {
  const theme = useTheme();
  const { fg, soft } = toneColors(theme, tone);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: soft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={size * 0.5} stroke={2} color={fg} />
    </View>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────
export function Bar({ pct, tone = 'primary', height = 8 }: { pct: number; tone?: Tone; height?: number }) {
  const theme = useTheme();
  const { fg } = toneColors(theme, tone);
  return (
    <View style={{ backgroundColor: theme.border, borderRadius: 999, height, overflow: 'hidden', width: '100%' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: fg }} />
    </View>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────
export function SectionLabel({
  children,
  action,
  onAction,
}: {
  children: ReactNode;
  action?: string | null;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginHorizontal: 4,
        marginTop: 4,
        marginBottom: 10,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: theme.muted }}>
        {children}
      </Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.primary }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Rating badge + dots ─────────────────────────────────────────────────────────
export function RatingBadge({ value, small = false }: { value: string; small?: boolean }) {
  const theme = useTheme();
  const r = RATING[value] ?? { v: 'primary' as Tone, n: 3 };
  const { fg, soft } = toneColors(theme, r.v);
  return (
    <View
      style={{
        backgroundColor: soft,
        paddingVertical: small ? 3 : 5,
        paddingHorizontal: small ? 9 : 11,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 11.5 : 13 }}>{value}</Text>
    </View>
  );
}

export function RatingDots({ value }: { value: string }) {
  const theme = useTheme();
  const r = RATING[value] ?? { v: 'primary' as Tone, n: 3 };
  const { fg } = toneColors(theme, r.v);
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: i <= r.n ? fg : theme.border }}
        />
      ))}
    </View>
  );
}

// ── Voice note bubble ────────────────────────────────────────────────────────────
const VN_BARS = [10, 16, 22, 14, 20, 9, 17, 24, 13, 19, 11, 21, 15, 8, 18, 12, 22, 10, 16, 20];

export function VoiceNote({ duration = '0:24', mine = false }: { duration?: string; mine?: boolean }) {
  const theme = useTheme();
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    if (!playing) return;
    if (prog >= 1) {
      setProg(0);
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setProg((x) => Math.min(1, x + 0.04)), 90);
    return () => clearTimeout(t);
  }, [playing, prog]);

  const ink = mine ? 'rgba(255,255,255,0.95)' : theme.primary;
  const track = mine ? 'rgba(255,255,255,0.35)' : theme.border;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <Pressable
        onPress={() => setPlaying((x) => !x)}
        style={{
          width: 34,
          height: 34,
          borderRadius: 34,
          backgroundColor: mine ? 'rgba(255,255,255,0.22)' : theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={playing ? 'pause' : 'play'} size={16} color={ink} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2.5, flex: 1, height: 28 }}>
        {VN_BARS.map((h, i) => (
          <View
            key={i}
            style={{ width: 2.5, height: h, borderRadius: 2, backgroundColor: i / VN_BARS.length <= prog ? ink : track }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: mine ? 'rgba(255,255,255,0.9)' : theme.muted }}>
        {duration}
      </Text>
    </View>
  );
}

// ── Round header button ──────────────────────────────────────────────────────────
export function RoundBtn({ icon, onPress, badge }: { icon: string; onPress?: () => void; badge?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 40,
        height: 40,
        borderRadius: 40,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border2,
        alignItems: 'center',
        justifyContent: 'center',
        ...(theme.shadowSm as object),
      }}
    >
      <Icon name={icon} size={20} stroke={1.9} color={theme.text} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: 17,
            height: 17,
            paddingHorizontal: 4,
            borderRadius: 999,
            backgroundColor: theme.red,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: theme.bg,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ── App header ───────────────────────────────────────────────────────────────────
export function AppHeader({
  title,
  subtitle,
  back,
  onBack,
  right,
  big = false,
  avatar,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  big?: boolean;
  avatar?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.bg, paddingTop: 12, paddingHorizontal: 18, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
        {back ? (
          <Pressable onPress={onBack} style={{ width: 38, height: 38, marginLeft: -8, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevL" size={24} stroke={2.2} color={theme.text} />
          </Pressable>
        ) : null}
        {avatar}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: big ? 27 : 20, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={{ fontSize: 13.5, color: theme.muted, marginTop: 1 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

// ── Ring progress (homework summary) ───────────────────────────────────────────────
export function Ring({ done, total, size = 54 }: { done: number; total: number; size?: number }) {
  const theme = useTheme();
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.border} strokeWidth={6} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.primary}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>
        {done}/{total}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({});
export type { Theme };
