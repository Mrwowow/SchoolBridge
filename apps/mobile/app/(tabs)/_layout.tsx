/**
 * app/(tabs)/_layout.tsx
 * The authenticated experience is the single-surface AppShell (its own internal
 * tab bar matches the mockup), so this group is a plain headerless Stack —
 * index.tsx hosts the shell.
 */
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthedLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
