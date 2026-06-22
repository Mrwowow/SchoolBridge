/**
 * ChatThread — message thread with composer + voice notes.
 * Ported from screens-shared.jsx ChatThread.
 */
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { VoiceNote } from '../design/components';
import { Icon } from '../design/Icon';
import { MESSAGES, TODAY, type ChatMessage } from '../mock/data';
import { useMessage, useReply } from '../hooks';

export function ChatThread({
  role,
  pupilId,
  messageId,
}: {
  role: 'parent' | 'teacher';
  pupilId?: string;
  messageId?: string;
}) {
  const theme = useTheme();
  const mineSide = role === 'teacher' ? 'teacher' : 'parent';
  const [msgs, setMsgs] = useState<ChatMessage[]>(MESSAGES);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Live message detail (only when messageId is provided)
  const { data: messageDetail } = useMessage(messageId ?? '');
  const replyMutation = useReply(messageId ?? '');

  const hasLiveThread = !!messageId && !!messageDetail;

  const sendMock = () => {
    const text = draft.trim();
    if (!text) return;
    setMsgs((m) => [...m, { id: `x${m.length}`, from: mineSide, text, time: 'now' }]);
    setDraft('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const sendLive = () => {
    const text = draft.trim();
    if (!text) return;
    replyMutation.mutate({ body: text });
    setDraft('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const handleSend = hasLiveThread ? sendLive : sendMock;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 6 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <Text style={{ textAlign: 'center', fontSize: 12, color: theme.muted2, marginVertical: 12 }}>
          Today · {TODAY}
        </Text>

        {hasLiveThread ? (
          // Live thread: render replies from messageDetail
          messageDetail.replies.map((reply) => {
            const mine = reply.author.role === mineSide;
            return (
              <View
                key={reply.id}
                style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}
              >
                <View
                  style={{
                    maxWidth: '78%',
                    paddingVertical: reply.audioUrl ? 12 : 10,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    borderBottomRightRadius: mine ? 6 : 20,
                    borderBottomLeftRadius: mine ? 20 : 6,
                    backgroundColor: mine ? theme.primary : theme.surface,
                    borderWidth: mine ? 0 : 1,
                    borderColor: theme.border2,
                    minWidth: reply.audioUrl ? 200 : 0,
                    ...(theme.shadowSm as object),
                  }}
                >
                  {reply.audioUrl ? (
                    <VoiceNote duration="0:00" mine={mine} />
                  ) : (
                    <Text style={{ fontSize: 14.5, lineHeight: 21, color: mine ? '#fff' : theme.text }}>
                      {reply.body}
                    </Text>
                  )}
                  <Text
                    style={{
                      fontSize: 10.5,
                      marginTop: 4,
                      textAlign: 'right',
                      color: mine ? 'rgba(255,255,255,0.75)' : theme.muted2,
                    }}
                  >
                    {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          // Mock fallback
          msgs.map((m) => {
            const mine = m.from === mineSide;
            return (
              <View
                key={m.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: mine ? 'flex-end' : 'flex-start',
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    maxWidth: '78%',
                    paddingVertical: m.voice ? 12 : 10,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    borderBottomRightRadius: mine ? 6 : 20,
                    borderBottomLeftRadius: mine ? 20 : 6,
                    backgroundColor: mine ? theme.primary : theme.surface,
                    borderWidth: mine ? 0 : 1,
                    borderColor: theme.border2,
                    minWidth: m.voice ? 200 : 0,
                    ...(theme.shadowSm as object),
                  }}
                >
                  {m.voice ? (
                    <VoiceNote duration={m.voice} mine={mine} />
                  ) : (
                    <Text style={{ fontSize: 14.5, lineHeight: 21, color: mine ? '#fff' : theme.text }}>
                      {m.text}
                    </Text>
                  )}
                  <Text
                    style={{
                      fontSize: 10.5,
                      marginTop: 4,
                      textAlign: 'right',
                      color: mine ? 'rgba(255,255,255,0.75)' : theme.muted2,
                    }}
                  >
                    {m.time}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Composer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: 14,
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <Pressable>
          <Icon name="paperclip" size={22} color={theme.muted} />
        </Pressable>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 4,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleSend}
            placeholder="Message…"
            placeholderTextColor={theme.muted2}
            style={{ flex: 1, fontSize: 14.5, color: theme.text, paddingVertical: 6 }}
          />
          <Icon name="mic" size={20} color={theme.muted} />
        </View>
        <Pressable
          onPress={handleSend}
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="send" size={20} stroke={2.2} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
