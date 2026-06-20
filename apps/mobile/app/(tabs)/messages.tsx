/**
 * app/(tabs)/messages.tsx
 * Parent "Messages" tab — a quick overview linking to each child's booklet feed.
 * Full message detail is at /pupil/[id] and /message/[id].
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useChildren } from '../../src/hooks/useChildren';
import { Card, CountBadge } from '../../components';
import { Colors, Spacing, FontSize, FontWeight } from '../../src/theme';

export default function MessagesTab() {
  const router = useRouter();
  const { data: children, isLoading, isError } = useChildren();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.brand} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load messages.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sub}>Tap a child to view their booklet</Text>
      </View>

      <FlatList
        data={children ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No children linked.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/pupil/${item.id}`)}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.className}>{item.className}</Text>
              </View>
              <CountBadge count={item.unreadCount} filled />
            </View>
          </Card>
        )}
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
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  list: { padding: Spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: { flex: 1 },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  className: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  errorText: { color: Colors.error, fontSize: FontSize.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
