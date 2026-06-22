/**
 * TeacherInbox — searchable parent conversation list with unread badges.
 * Ported from screens-teacher.jsx TeacherInbox.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Avatar, Card } from '../design/components';
import { Icon } from '../design/Icon';
import { INBOX, type InboxThread } from '../mock/data';
import { useInbox } from '../hooks';

function deriveInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function stableHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 360;
  }
  return h;
}

function formatThreadTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function TeacherInbox({ onOpen }: { onOpen: (thread: InboxThread & { pupilId?: string }) => void }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const { data: liveThreads } = useInbox();

  const threads: (InboxThread & { pupilId?: string })[] =
    liveThreads && liveThreads.length > 0
      ? liveThreads.map((t) => ({
          parent: t.parentName ?? 'Parent',
          child: t.pupilName,
          initials: deriveInitials(t.pupilName),
          last: t.lastMessage,
          time: formatThreadTime(t.lastAt),
          unread: t.unread,
          hue: stableHue(t.pupilId) % 360,
          pupilId: t.pupilId,
        }))
      : INBOX;

  const list = threads.filter(
    (c) => c.parent.toLowerCase().includes(query.toLowerCase()) || c.child.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View>
      {/* Search */}
      <View style={{ marginBottom: 16, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: 14, zIndex: 1 }}>
          <Icon name="search" size={18} color={theme.muted2} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search parents…"
          placeholderTextColor={theme.muted2}
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 14,
            paddingVertical: 12,
            paddingLeft: 42,
            paddingRight: 14,
            fontSize: 14.5,
            color: theme.text,
          }}
        />
      </View>

      <Card pad={4}>
        {list.map((c, i) => (
          <Pressable
            key={c.pupilId ?? c.parent}
            onPress={() => onOpen(c)}
            style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderTopWidth: i ? 1 : 0, borderTopColor: theme.border2 }}
          >
            <View>
              <Avatar initials={c.initials} hue={c.hue} size={46} />
              {c.unread > 0 ? (
                <View style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 999, backgroundColor: theme.primary, borderWidth: 2, borderColor: theme.surface }} />
              ) : null}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: theme.text }}>{c.parent}</Text>
                <Text style={{ fontSize: 11.5, color: c.unread ? theme.primary : theme.muted2, fontWeight: c.unread ? '700' : '400' }}>{c.time}</Text>
              </View>
              <Text style={{ fontSize: 11.5, color: theme.muted2, marginVertical: 1 }}>Parent of {c.child}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 13, color: c.unread ? theme.text : theme.muted, fontWeight: c.unread ? '600' : '400' }}
                >
                  {c.last}
                </Text>
                {c.unread > 0 ? (
                  <View style={{ minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 999, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{c.unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
