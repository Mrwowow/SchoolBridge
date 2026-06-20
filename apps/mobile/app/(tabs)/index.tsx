/**
 * app/(tabs)/index.tsx
 * Parent Home — list of linked children (pupils).
 * Each card navigates to the child's digital-booklet feed at /pupil/[id].
 *
 * Teachers are redirected to a simple "Classes" placeholder here;
 * a full classes list would be a follow-up feature.
 */
import React, { useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useChildren } from '../../src/hooks/useChildren';
import type { PupilSummary } from '../../src/api/pupils';
import { Card, CountBadge } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/theme';

function ChildCard({
  pupil,
  onPress,
}: {
  pupil: PupilSummary;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardRow}>
        {/* Avatar initials */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {pupil.fullName
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.childName}>{pupil.fullName}</Text>
          <Text style={styles.childMeta}>
            {pupil.className} · {pupil.admissionNumber}
          </Text>
        </View>

        <View style={styles.badgeCol}>
          <CountBadge count={pupil.unreadCount} filled />
          <Text style={styles.feedLink}>View feed →</Text>
        </View>
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = user?.memberships[0]?.role ?? 'PARENT';
  const isTeacher = role === 'TEACHER' || role === 'CLASS_TEACHER';

  const { data: children, isLoading, isError, refetch, isRefetching } =
    useChildren();

  const handleRefresh = useCallback(() => { void refetch(); }, [refetch]);

  if (isTeacher) {
    // TODO: replace with real classes list for teachers
    return (
      <View style={styles.center}>
        <Text style={styles.teacherPlaceholder}>
          Your classes will appear here.
        </Text>
        <Text style={styles.teacherSub}>
          Tap "Compose" to send a message to a pupil or class.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.brand} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load children. Pull to retry.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {user?.fullName?.split(' ')[0] ?? 'Parent'}
        </Text>
        <Text style={styles.headerSub}>Your children's updates</Text>
      </View>

      <FlatList
        data={children ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.brand}
            colors={[Colors.brand]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No children linked to your account.</Text>
            <Text style={styles.emptySub}>Contact your school admin to link a pupil.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ChildCard
            pupil={item}
            onPress={() => router.push(`/pupil/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: Spacing.md,
  },
  card: {
    marginBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.brand,
  },
  cardInfo: {
    flex: 1,
  },
  childName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  childMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  feedLink: {
    fontSize: FontSize.xs,
    color: Colors.brand,
    fontWeight: FontWeight.medium,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  teacherPlaceholder: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  teacherSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  empty: {
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
