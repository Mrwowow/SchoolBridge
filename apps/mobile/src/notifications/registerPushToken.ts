/**
 * src/notifications/registerPushToken.ts
 * Requests notification permissions and registers the Expo push token
 * with the SchoolBridge backend.
 *
 * Call this after a successful login (token + schoolId are available).
 */
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApi } from '../api';

/** Configure how notifications are shown while the app is in the foreground */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken(): Promise<string | null> {
  // Physical device check
  const isDevice = Constants.isDevice ?? true; // expo-constants ≥ 16
  if (!isDevice) {
    console.info('[Push] Skipping push registration on simulator/emulator');
    return null;
  }

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
  // TODO: replace with your Expo project ID from app.json / EAS
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

  const { data: token } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  // Register with backend
  try {
    await notificationsApi.registerPushToken(token);
    console.info('[Push] Token registered:', token);
  } catch (err) {
    // Non-fatal — push notifications will still work via polling fallback
    console.warn('[Push] Failed to register token with backend', err);
  }

  return token;
}
