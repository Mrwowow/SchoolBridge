/**
 * app/_layout.tsx
 * Root layout: auth hydration + redirect gate, safe-area, status bar.
 * (Notifications setup is intentionally deferred to keep the root module load
 * side-effect-free; it can be re-introduced lazily once running on a dev build.)
 */
import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/authStore';
import { SplashScreen } from '../src/screens/SplashScreen';

// One QueryClient for the app's lifetime. Created at module scope so it is not
// recreated on re-render (which would drop the cache).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  // The animated splash overlays the app on launch; it dismisses itself once the
  // logo intro finishes (or after a safety timeout). Routes mount underneath so
  // the first screen is ready the moment the splash fades.
  const [splashDone, setSplashDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootNavigator />
        {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
