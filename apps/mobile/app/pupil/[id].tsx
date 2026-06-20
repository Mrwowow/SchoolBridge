/**
 * app/pupil/[id].tsx
 * Child's digital-booklet FEED — chronological message list with:
 *  - Type badges (NOTE, HOMEWORK, ATTENDANCE, etc.)
 *  - Acknowledge button on items needing acknowledgement
 *  - Tap to open message detail
 *  - Infinite scroll / pull-to-refresh
 */
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { usePupilFeed } from '../../src/hooks/usePupilFeed';
import { useAcknowledge } from '../../src/hooks/useAcknowledge';
import type { MessageItem } from '../../src/api/messages';
import { MessageTypeBadge, Card } from '../../components';
import { Colors, Spacing, FontSize, FontWeight } from '../../src/theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function FeedItem({ item }: { item: MessageItem }) {
  const router = useRouter();
  const needsAck =
    item.receipt !== null &&
    !item.receipt.acknowledged &&
    (item.type === 'HOMEWORK' ||
      item.type === 'RESULT' ||
      item.type === 'FEE_REMINDER');

  const ack = useAcknowledge(item.id);

  return (
    <Card onPress={() => router.push(`/message/${item.id}`)}>
      <View style={styles.itemHeader}>
        <MessageTypeBadge type={item.type} />
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>

      {item.body ? (
        <Text style={styles.itemBody} numberOfLines={3}>{item.body}</Text>
      ) : null}

      {item.dueAt && (
        <Text style={styles.dueDate}>
          Due: {formatDate(item.dueAt)}
        </Text>
      )}

      <View style={styles.itemFooter}>
        <Text style={styles.senderName}>
          {item.sender.fullName}
        </Text>

        {item.replyCount > 0 && (
          <Text style={styles.replyCount}>
            {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
          </Text>
        )}

        {needsAck && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              ack.mutate();
            }}
            disabled={ack.isPending}
            style={styles.ackBtn}
            accessibilityLabel="Acknowledge this message"
          >
            <Text style={styles.ackBtnText}>
              {ack.isPending ? 'Acknowledging…' : 'Acknowledge'}
            </Text>
          </Pressable>
        )}

        {item.receipt?.acknowledged && (
          <View style={styles.ackedRow}>
            <Text style={styles.ackedText}>Acknowledged</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

export default function PupilFeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = usePupilFeed(id);

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const handleRefresh = useCallback(() => { void refetch(); }, [refetch]);
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Booklet',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.brand,
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Failed to load feed. Pull down to retry.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
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
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={Colors.brand}
                style={{ marginVertical: Spacing.md }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No entries yet.</Text>
              <Text style={styles.emptySub}>
                Messages from teachers will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => <FeedItem item={item} />}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  itemTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  dueDate: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 4,
  },
  senderName: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flex: 1,
  },
  replyCount: {
    fontSize: FontSize.xs,
    color: Colors.brand,
  },
  ackBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  ackBtnText: {
    fontSize: FontSize.xs,
    color: Colors.surface,
    fontWeight: FontWeight.semibold,
  },
  ackedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ackedText: {
    fontSize: FontSize.xs,
    color: Colors.success,
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
  empty: {
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
