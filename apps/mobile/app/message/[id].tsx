/**
 * app/message/[id].tsx
 * Message detail with attachments + threaded replies.
 * Both parents and teachers can view this screen.
 * Replies: parents reply to teachers, teachers reply to parents.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMessage, useReplies, useReply } from '../../src/hooks/useMessage';
import { useAcknowledge } from '../../src/hooks/useAcknowledge';
import type { ReplyItem } from '../../src/api/messages';
import { MessageTypeBadge } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/theme';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ReplyBubble({ reply }: { reply: ReplyItem }) {
  return (
    <View style={styles.replyBubble}>
      <Text style={styles.replySender}>{reply.sender.fullName}</Text>
      <Text style={styles.replyBody}>{reply.body}</Text>
      <Text style={styles.replyTime}>{formatDateTime(reply.createdAt)}</Text>
    </View>
  );
}

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);
  const [replyText, setReplyText] = useState('');

  const { data: message, isLoading: msgLoading, isError: msgError } = useMessage(id);
  const {
    data: repliesData,
    isLoading: repliesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReplies(id);
  const replyMutation = useReply(id);
  const ackMutation = useAcknowledge(id);

  const replies = useMemo(
    () => repliesData?.pages.flatMap((p) => p.items) ?? [],
    [repliesData],
  );

  const handleSendReply = useCallback(() => {
    const body = replyText.trim();
    if (!body) return;

    replyMutation.mutate(body, {
      onSuccess: () => {
        setReplyText('');
        // Scroll to bottom after reply
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
      },
      onError: (err) => {
        Alert.alert('Failed to send', err.message);
      },
    });
  }, [replyText, replyMutation]);

  const needsAck =
    message?.receipt !== null &&
    !message?.receipt?.acknowledged &&
    (message?.type === 'HOMEWORK' ||
      message?.type === 'RESULT' ||
      message?.type === 'FEE_REMINDER');

  if (msgLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.brand} size="large" />
      </View>
    );
  }

  if (msgError || !message) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Message not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Message',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.brand,
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >
        <FlatList
          ref={flatListRef}
          data={replies}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={
            <View style={styles.messageCard}>
              {/* Type + timestamp */}
              <View style={styles.metaRow}>
                <MessageTypeBadge type={message.type} />
                <Text style={styles.metaDate}>
                  {formatDateTime(message.createdAt)}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.messageTitle}>{message.title}</Text>

              {/* Sender */}
              <Text style={styles.senderLine}>
                From: {message.sender.fullName}
              </Text>

              {/* Body */}
              {message.body ? (
                <Text style={styles.messageBody}>{message.body}</Text>
              ) : null}

              {/* Due date */}
              {message.dueAt && (
                <View style={styles.dueRow}>
                  <Text style={styles.dueLabel}>Due:</Text>
                  <Text style={styles.dueValue}>
                    {formatDateTime(message.dueAt)}
                  </Text>
                </View>
              )}

              {/* Attachments */}
              {message.attachments.length > 0 && (
                <View style={styles.attachSection}>
                  <Text style={styles.attachTitle}>Attachments</Text>
                  {message.attachments.map((key, i) => (
                    <View key={key} style={styles.attachItem}>
                      <Text style={styles.attachText}>
                        {/* TODO: render downloadable link when file-server URL is available */}
                        Attachment {i + 1}: {key}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Acknowledge button */}
              {needsAck && (
                <Pressable
                  onPress={() => ackMutation.mutate()}
                  disabled={ackMutation.isPending}
                  style={styles.ackBtn}
                >
                  <Text style={styles.ackBtnText}>
                    {ackMutation.isPending ? 'Acknowledging…' : 'Mark as Acknowledged'}
                  </Text>
                </Pressable>
              )}

              {message.receipt?.acknowledged && (
                <Text style={styles.ackedLine}>You acknowledged this message.</Text>
              )}

              {/* Replies header */}
              {(replies.length > 0 || repliesLoading) && (
                <Text style={styles.repliesHeader}>Replies</Text>
              )}
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={Colors.brand}
                style={{ marginVertical: Spacing.md }}
              />
            ) : null
          }
          renderItem={({ item }) => <ReplyBubble reply={item} />}
        />

        {/* Reply composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Write a reply…"
            placeholderTextColor={Colors.textMuted}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={2000}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSendReply}
            disabled={!replyText.trim() || replyMutation.isPending}
            style={[
              styles.sendBtn,
              (!replyText.trim() || replyMutation.isPending) && styles.sendBtnDisabled,
            ]}
            accessibilityLabel="Send reply"
          >
            {replyMutation.isPending ? (
              <ActivityIndicator color={Colors.surface} size="small" />
            ) : (
              <Text style={styles.sendBtnText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  messageCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metaDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  messageTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  senderLine: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  messageBody: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  dueRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  dueLabel: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: FontWeight.semibold,
  },
  dueValue: {
    fontSize: FontSize.sm,
    color: Colors.warning,
  },
  attachSection: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.divider,
    borderRadius: Radius.sm,
  },
  attachTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  attachItem: { marginBottom: 2 },
  attachText: {
    fontSize: FontSize.sm,
    color: Colors.brand,
  },
  ackBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.brand,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  ackBtnText: {
    color: Colors.surface,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  ackedLine: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  repliesHeader: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: 0,
  },

  // Reply bubbles
  replyBubble: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brandLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  replySender: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.brand,
    marginBottom: 4,
  },
  replyBody: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  replyTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // Composer
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  sendBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    color: Colors.surface,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorText: { color: Colors.error, fontSize: FontSize.md },
});
