/**
 * app/(tabs)/compose-tab.tsx
 * Placeholder tab screen for the teacher compose tab.
 * This immediately redirects to the compose modal screen.
 * The actual UI is in app/compose.tsx.
 */
import { Redirect } from 'expo-router';

export default function ComposeTab() {
  return <Redirect href="/compose" />;
}
