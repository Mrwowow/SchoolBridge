/**
 * src/design/AnimatedLogo.tsx
 * The SchoolBridge animated "bridge" mark + wordmark, ported from the animated
 * logo mockup (SchoolBridge Logo - Animated). Sequence:
 *   footL pop → arch draw → footR pop → key drop → ring ripple → wordmark wipe,
 * with a gentle continuous float on the whole lockup.
 *
 * Variants match the mockup's backgrounds: 'blue' | 'dark' | 'light'.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Easing, type TextStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ARCH_LEN = 100; // pathLength normalised in the source

type Variant = 'blue' | 'dark' | 'light';

interface Palette {
  arch: string;
  foot: string;
  key: string;
  ring: string;
  wm1: string; // "School"
  wm2: string; // "Bridge"
}

const PALETTES: Record<Variant, Palette> = {
  blue: { arch: '#fff', foot: '#fff', key: '#FFB488', ring: '#FFB488', wm1: '#fff', wm2: '#fff' },
  dark: { arch: '#fff', foot: '#fff', key: '#FFB488', ring: '#FFB488', wm1: '#fff', wm2: '#6E9BFF' },
  light: { arch: '#2F6BFF', foot: '#2F6BFF', key: '#E0702B', ring: '#E0702B', wm1: '#18233B', wm2: '#2F6BFF' },
};

export function AnimatedLogo({
  size = 132,
  variant = 'blue',
  orientation = 'row',
  onComplete,
}: {
  size?: number;
  variant?: Variant;
  /** 'row' = horizontal lockup (original); 'column' = stacked (splash). */
  orientation?: 'row' | 'column';
  onComplete?: () => void;
}) {
  const pal = PALETTES[variant];
  const vertical = orientation === 'column';

  // Drivers (0 → 1) for each element, fired with the mockup's delays.
  const footL = useRef(new Animated.Value(0)).current;
  const arch = useRef(new Animated.Value(0)).current;
  const footR = useRef(new Animated.Value(0)).current;
  const key = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const wm = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // NOTE: these values feed react-native-svg props (strokeDashoffset, scale,
    // origin, opacity) which the native animation driver cannot animate, so the
    // intro must run on the JS driver (useNativeDriver: false).
    const seq = Animated.sequence([
      Animated.delay(100),
      Animated.spring(footL, { toValue: 1, useNativeDriver: false, friction: 5, tension: 120 }),
      Animated.delay(120),
      Animated.timing(arch, { toValue: 1, duration: 900, easing: Easing.bezier(0.65, 0, 0.35, 1), useNativeDriver: false }),
      Animated.spring(footR, { toValue: 1, useNativeDriver: false, friction: 5, tension: 120 }),
      Animated.delay(60),
      Animated.spring(key, { toValue: 1, useNativeDriver: false, friction: 5, tension: 90 }),
      Animated.parallel([
        Animated.timing(ring, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(wm, { toValue: 1, duration: 800, delay: 110, easing: Easing.bezier(0.5, 0, 0.15, 1), useNativeDriver: false }),
      ]),
    ]);

    seq.start(({ finished }) => {
      if (finished) onComplete?.();
    });

    // Continuous gentle float on the outer View transform (native-drivable).
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    floatLoop.start();

    return () => {
      seq.stop();
      floatLoop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  // Per-element transforms (matching the source keyframes).
  const footLScale = footL.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const footRScale = footR.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const archOffset = arch.interpolate({ inputRange: [0, 1], outputRange: [ARCH_LEN, 0] });
  const keyScale = key.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const keyY = key.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.4, 3] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const wmTranslate = wm.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });

  // Smaller wordmark when stacked so it fits a phone splash comfortably.
  const wordSize = size * (vertical ? 0.3 : 0.42);
  const wmTextBase: TextStyle = { fontSize: wordSize, fontWeight: '800', letterSpacing: -wordSize * 0.035 };

  return (
    <Animated.View
      style={{
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: vertical ? size * 0.12 : size * 0.18,
        transform: [{ translateY: floatY }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Arch — strokes in via dashoffset */}
        <AnimatedPath
          d="M22 67 C22 33 78 33 78 67"
          fill="none"
          stroke={pal.arch}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={ARCH_LEN}
          strokeDashoffset={archOffset}
        />
        {/* Feet — pop in */}
        <AnimatedCircle cx={22} cy={67} r={9} fill={pal.foot} opacity={footL} originX={22} originY={67} scale={footLScale} />
        <AnimatedCircle cx={78} cy={67} r={9} fill={pal.foot} opacity={footR} originX={78} originY={67} scale={footRScale} />
        {/* Ring — ripple out */}
        <AnimatedCircle
          cx={50}
          cy={31}
          r={7}
          fill="none"
          stroke={pal.ring}
          strokeWidth={3}
          originX={50}
          originY={31}
          scale={ringScale}
          opacity={ringOpacity}
        />
        {/* Key — drops from top */}
        <AnimatedCircle
          cx={50}
          cy={31}
          r={7}
          fill={pal.key}
          opacity={key}
          originX={50}
          originY={31}
          scale={keyScale}
          translateY={keyY}
        />
      </Svg>

      {/* Wordmark — wipes / fades in */}
      <Animated.View style={{ opacity: wm, transform: [{ translateX: wmTranslate }] }}>
        <Text style={{ ...wmTextBase }} numberOfLines={1}>
          <Text style={{ color: pal.wm1, fontWeight: '600' }}>School</Text>
          <Text style={{ color: pal.wm2 }}>Bridge</Text>
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
