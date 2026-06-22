/**
 * src/notifications/registerPushToken.ts
 * Requests notification permissions and registers the Expo push token
 * with the SchoolBridge backend.
 *
 * Call this after a successful login (token + schoolId are available).
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsApi } from '../api';

/**
 * Remote (push) notifications were removed from Expo Go in SDK 53+. Detect Expo
 * Go so we can skip push-token registration there — it requires a development or
 * production build instead. https://docs.expo.dev/develop/development-builds/
 */
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * IMPORTANT: `expo-notifications` is loaded lazily via require() inside the
 * function below, NOT statically at the top of this module. In Expo Go on
 * Android (SDK 53+), merely importing the module's remote-push surface throws,
 * which would poison every route that transitively imports this file (the login
 * screen included) and surface as a misleading "missing default export" warning.
 * Requiring it only on a real build keeps the module graph load-safe everywhere.
 */
let handlerConfigured = false;
function ensureHandler(Notifications: typeof import('expo-notifications')) {
  if (handlerConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  handlerConfigured = true;
}

export async function registerPushToken(): Promise<string | null> {
  // Physical device check (Constants.isDevice was removed in SDK 55)
  if (!Device.isDevice) {
    console.info('[Push] Skipping push registration on simulator/emulator');
    return null;
  }

  // Expo Go can't obtain a push token on SDK 53+; requires a dev build. Bail
  // BEFORE touching expo-notifications, which throws here in Expo Go.
  if (isExpoGo) {
    console.info(
      '[Push] Skipping push registration in Expo Go — use a development build for push notifications.',
    );
    return null;
  }

  // Lazy load: safe now that we know we're on a real build, not Expo Go.
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  ensureHandler(Notifications);

  // Android channel setup (required for Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('schoolbridge', {
      name: 'SchoolBridge',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2F6BFF',
    });
  }

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission not granted');
    return null;
  }

  // Get Expo push token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

  const { data: token } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  // Register with backend (platform must be ios|android|web per the API DTO).
  try {
    const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
    await notificationsApi.registerPushToken(token, platform);
    console.info('[Push] Token registered:', token);
  } catch (err) {
    // Non-fatal — push notifications will still work via polling fallback
    console.warn('[Push] Failed to register token with backend', err);
  }

  return token;
}
