/**
 * app/(tabs)/index.tsx
 * Hosts the AppShell — the full role-aware SchoolBridge experience matching the
 * mockup. The role is derived from the logged-in user's membership:
 *   PARENT → parent experience; TEACHER / CLASS_TEACHER → teacher experience.
 */
import React from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { ThemeProvider } from '../../src/design/ThemeProvider';
import { AppShell, type Role } from '../../src/screens/AppShell';

function roleFromMembership(apiRole: string | undefined): Role {
  return apiRole === 'TEACHER' || apiRole === 'CLASS_TEACHER' ? 'teacher' : 'parent';
}

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = roleFromMembership(user?.memberships[0]?.role);

  const parentName = (user?.fullName ?? 'Parent').split(' ').slice(-1)[0];
  const parentInitials = (user?.fullName ?? 'P')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function openMenu() {
    Alert.alert('Account', user?.fullName ?? 'Signed in', [
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
      { text: 'Close', style: 'cancel' },
    ]);
  }

  return (
    <ThemeProvider>
      <AppShell role={role} parentName={parentName} parentInitials={parentInitials} onOpenProfileMenu={openMenu} />
    </ThemeProvider>
  );
}
