/**
 * src/screens/SplashScreen.tsx
 * Branded splash: the animated SchoolBridge logo on the brand-blue field.
 * Plays the intro once, holds briefly, then fades out and calls onFinish.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AnimatedLogo } from '../design/AnimatedLogo';

// Dark variant from the animated-logo mockup: deep navy field (the mockup uses
// a radial #1b2440 → #0c1224; we use the darker stop as a flat fill).
const SPLASH_BG = '#0c1224';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fade = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);
  const { width } = useWindowDimensions();

  function finish() {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(fade, { toValue: 0, duration: 420, useNativeDriver: true }).start(() => onFinish());
  }

  // Safety net only — generously past the full intro (~4.2s) + hold (~800ms) +
  // fade (~420ms) so it never pre-empts the animation; it just guards against a
  // missed onComplete (e.g. reduced-motion).
  useEffect(() => {
    const t = setTimeout(finish, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Size the mark to the screen so the stacked lockup is always centred + fits.
  const markSize = Math.min(150, Math.round(width * 0.34));

  return (
    <Animated.View style={[styles.root, { opacity: fade }]}>
      <StatusBar style="light" />
      <AnimatedLogo
        variant="dark"
        orientation="column"
        size={markSize}
        // Let the intro fully finish, hold ~800ms, then fade out.
        onComplete={() => setTimeout(finish, 800)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
