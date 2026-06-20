/**
 * app/(tabs)/profile.tsx
 * User profile screen with logout.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api';
import { Button, Card } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/theme';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const schoolId = useAuthStore((s) => s.schoolId);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const role = user?.memberships[0]?.role ?? 'PARENT';

  async function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await authApi.logout();
          } catch {
            // ignore — log out locally even if the API call fails
          }
          await logout();
          setLoggingOut(false);
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.heroSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.fullName ?? 'U')
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName ?? '—'}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{role.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Info card */}
      <Card style={styles.infoCard}>
        <InfoRow label="Phone" value={user?.phone ?? '—'} />
        {user?.email && <InfoRow label="Email" value={user.email} />}
        <InfoRow label="Language" value={user?.locale?.toUpperCase() ?? 'EN'} />
        <InfoRow label="School ID" value={schoolId ?? '—'} />
      </Card>

      {/* Logout */}
      <Button
        label={loggingOut ? 'Signing out…' : 'Sign out'}
        onPress={handleLogout}
        variant="ghost"
        loading={loggingOut}
        style={styles.logoutBtn}
      />

      <Text style={styles.version}>SchoolBridge v1.0.0</Text>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingTop: 60,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.brand,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  rolePill: {
    backgroundColor: Colors.brandLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: FontSize.sm,
    color: Colors.brand,
    fontWeight: FontWeight.medium,
  },
  infoCard: { marginBottom: Spacing.lg },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: Spacing.sm,
  },
  logoutBtn: {
    marginBottom: Spacing.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
