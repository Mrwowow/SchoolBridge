/**
 * app/_layout.tsx
 * Root layout — bootstraps:
 *  - React Query (QueryClientProvider)
 *  - Safe area
 *  - Auth hydration + redirect gate
 *  - Notification listeners
 */
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import type { Subscription } from 'expo-notifications';
import { useAuthStore } from '../src/store/authStore';
import { registerPushToken } from '../src/notifications/registerPushToken';
import { Colors } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      // Keep data fresh for 2 min — conservative for low-bandwidth
      staleTime: 1000 * 60 * 2,
    },
  },
});

/** Handles auth-based routing: unauthenticated → /login */
function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();

  // Hydrate tokens from SecureStore on first mount
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface }}>
        <ActivityIndicator color={Colors.brand} size="large" />
      </View>
    );
  }

  return <Slot />;
}

/** Sets up Expo Notifications listeners at the root level */
function NotificationSetup({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const responseListenerRef = useRef<Subscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register push token after login
    void registerPushToken();

    // Navigate to the relevant screen when a user taps a notification
    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const deepLink = response.notification.request.content.data?.[
          'deepLink'
        ] as string | undefined;
        if (deepLink) {
          router.push(deepLink as Parameters<typeof router.push>[0]);
        }
      });

    return () => {
      if (responseListenerRef.current) {
        Notifications.removeNotificationSubscription(
          responseListenerRef.current,
        );
      }
    };
  }, [isAuthenticated, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NotificationSetup>
          <AuthGate />
        </NotificationSetup>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
