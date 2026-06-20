/**
 * app/(tabs)/notifications.tsx
 * In-app notification centre.
 */
import React, { useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useNotifications,
  useMarkAllRead,
} from '../../src/hooks/useNotifications';
import type { AppNotification } from '../../src/api/notifications';
import { Card } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/theme';

function NotifCard({ item }: { item: AppNotification }) {
  const router = useRouter();

  function handlePress() {
    if (item.deepLink) {
      router.push(item.deepLink as Parameters<typeof router.push>[0]);
    }
  }

  return (
    <Card onPress={item.deepLink ? handlePress : undefined} style={!item.read ? styles.unread : undefined}>
      {!item.read && <View style={styles.dot} />}
      <Text style={styles.notifTitle}>{item.title}</Text>
      <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
      <Text style={styles.notifTime}>
        {new Date(item.createdAt).toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Card>
  );
}

export default function NotificationsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const markAll = useMarkAllRead();

  const handleRefresh = useCallback(() => { void refetch(); }, [refetch]);

  const unreadCount = data?.filter((n) => !n.read).length ?? 0;

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
        <Text style={styles.errorText}>Could not load notifications.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable
            onPress={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <Text style={styles.markAllBtn}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(n) => n.id}
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
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        }
        renderItem={({ item }) => <NotifCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  markAllBtn: {
    fontSize: FontSize.sm,
    color: Colors.brand,
    fontWeight: FontWeight.medium,
  },
  list: { padding: Spacing.md },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
  },
  dot: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand,
  },
  notifTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  notifBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  errorText: { color: Colors.error, fontSize: FontSize.md },
  empty: { paddingTop: Spacing.xxl, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
