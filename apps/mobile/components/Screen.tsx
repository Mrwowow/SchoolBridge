/**
 * components/Screen.tsx
 * Full-screen container that pads for safe area + applies background.
 */
import React from 'react';
import {
  type ViewStyle,
  type StyleProp,
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../src/theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Whether to wrap children in a ScrollView (default: false) */
  scroll?: boolean;
  /** Skip horizontal padding — useful for full-width lists */
  noPadding?: boolean;
}

export function Screen({
  children,
  style,
  scroll = false,
  noPadding = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: noPadding ? 0 : Spacing.md,
  };

  if (scroll) {
    return (
      <View style={[containerStyle, style]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            { paddingHorizontal: noPadding ? 0 : Spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
