/**
 * HomeworkScreen — parent: tick off tasks; progress ring + reminders.
 * Ported from screens-parent.jsx HomeworkScreen.
 */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Card, Chip, IconTile, SectionLabel, Ring } from '../design/components';
import { Icon } from '../design/Icon';
import { HOMEWORK, REMINDERS, CHILD, type HomeworkItem } from '../mock/data';
import { usePupilFeed, useSubmitHomework } from '../hooks';

export function HomeworkScreen({
  role = 'parent',
  pupilId,
}: {
  role?: 'parent' | 'teacher';
  pupilId?: string;
}) {
  const theme = useTheme();

  // Live feed
  const feedQuery = usePupilFeed(pupilId ?? '');
  const feedItems = pupilId
    ? (feedQuery.data?.pages ?? []).flatMap((p) => p.items)
    : [];

  const submitMutation = useSubmitHomework();

  // Live homework items from feed (parent + pupilId path only)
  const liveHomework = feedItems.filter((m) => m.type === 'HOMEWORK');
  const hasLiveHomework = role !== 'teacher' && pupilId && liveHomework.length > 0;

  // Local toggle state for mock fallback
  const [items, setItems] = useState<HomeworkItem[]>(HOMEWORK);
  const toggle = (id: string) => {
    if (role !== 'teacher' && !pupilId) {
      setItems((it) => it.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));
    }
  };

  // Reminders from feed: EVENT | FEE_REMINDER | ANNOUNCEMENT
  const liveReminders = feedItems.filter(
    (m) => m.type === 'EVENT' || m.type === 'FEE_REMINDER' || m.type === 'ANNOUNCEMENT',
  );
  const hasLiveReminders = pupilId && liveReminders.length > 0;

  // Derive due/done counts for the ring
  const totalCount = hasLiveHomework ? liveHomework.length : items.length;
  const doneCount = hasLiveHomework
    ? liveHomework.filter((m) => m.submitted).length
    : items.filter((h) => h.done).length;
  const dueCount = totalCount - doneCount;

  return (
    <View>
      {/* Progress summary */}
      <Card style={{ marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Ring done={doneCount} total={totalCount} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>
            {dueCount === 0 ? 'All done!' : `${dueCount} task${dueCount > 1 ? 's' : ''} left`}
          </Text>
          <Text style={{ fontSize: 13, color: theme.muted }}>
            {role === 'teacher'
              ? 'Assigned to Primary 4 — Sapphire'
              : `Tick off ${CHILD.first}'s tasks as you go`}
          </Text>
        </View>
      </Card>

      {/* To do */}
      <SectionLabel>To do</SectionLabel>
      <View style={{ gap: 10, marginBottom: 18 }}>
        {hasLiveHomework
          ? liveHomework
              .filter((m) => !m.submitted)
              .map((h) => (
                <Card key={h.id} pad={14} style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                  <Pressable
                    onPress={() => {
                      if (pupilId) {
                        submitMutation.mutate({ messageId: h.id, pupilId });
                      }
                    }}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: theme.border,
                    }}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <Icon name="report" size={15} color={theme.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primary }}>{h.title}</Text>
                    </View>
                    <Text style={{ fontSize: 14.5, color: theme.text, lineHeight: 20 }}>{h.body ?? ''}</Text>
                    {h.dueAt ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                        <Icon name="clock" size={13} color={theme.amber} />
                        <Text style={{ fontSize: 12, color: theme.amber, fontWeight: '600' }}>
                          Due{' '}
                          {new Date(h.dueAt).toLocaleDateString([], {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              ))
          : items
              .filter((h) => !h.done)
              .map((h) => (
                <Card key={h.id} pad={14} style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                  <Pressable
                    onPress={() => toggle(h.id)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: theme.border,
                    }}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <Icon name={h.icon} size={15} color={theme.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primary }}>{h.subj}</Text>
                    </View>
                    <Text style={{ fontSize: 14.5, color: theme.text, lineHeight: 20 }}>{h.task}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                      <Icon name="clock" size={13} color={theme.amber} />
                      <Text style={{ fontSize: 12, color: theme.amber, fontWeight: '600' }}>Due {h.due}</Text>
                    </View>
                  </View>
                </Card>
              ))}
      </View>

      {/* Completed */}
      {(hasLiveHomework
        ? liveHomework.some((m) => m.submitted)
        : items.some((h) => h.done)) && (
        <View>
          <SectionLabel>Completed</SectionLabel>
          <View style={{ gap: 10, marginBottom: 18 }}>
            {hasLiveHomework
              ? liveHomework
                  .filter((m) => m.submitted)
                  .map((h) => (
                    <Card
                      key={h.id}
                      flat
                      pad={14}
                      style={{ flexDirection: 'row', gap: 13, alignItems: 'center', opacity: 0.7 }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          backgroundColor: theme.green,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="check" size={16} stroke={3} color="#fff" />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14.5,
                          color: theme.text,
                          textDecorationLine: 'line-through',
                        }}
                      >
                        {h.body ?? h.title}
                      </Text>
                    </Card>
                  ))
              : items
                  .filter((h) => h.done)
                  .map((h) => (
                    <Card
                      key={h.id}
                      flat
                      pad={14}
                      style={{ flexDirection: 'row', gap: 13, alignItems: 'center', opacity: 0.7 }}
                    >
                      <Pressable
                        onPress={() => toggle(h.id)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          backgroundColor: theme.green,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="check" size={16} stroke={3} color="#fff" />
                      </Pressable>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14.5,
                          color: theme.text,
                          textDecorationLine: 'line-through',
                        }}
                      >
                        {h.task}
                      </Text>
                    </Card>
                  ))}
          </View>
        </View>
      )}

      {/* Reminders */}
      <SectionLabel>Reminders</SectionLabel>
      <Card pad={4}>
        {hasLiveReminders
          ? liveReminders.map((r, i) => (
              <View
                key={r.id}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                  padding: 12,
                  paddingVertical: 13,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: theme.border2,
                }}
              >
                <IconTile icon="calendar" tone="primary" size={36} />
                <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '600', color: theme.text }}>{r.title}</Text>
                {r.dueAt ? (
                  <Chip tone="primary">
                    {new Date(r.dueAt).toLocaleDateString([], {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Chip>
                ) : null}
              </View>
            ))
          : REMINDERS.map((r, i) => (
              <View
                key={r.id}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                  padding: 12,
                  paddingVertical: 13,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: theme.border2,
                }}
              >
                <IconTile icon={r.icon} tone={r.tone} size={36} />
                <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '600', color: theme.text }}>{r.text}</Text>
                <Chip tone={r.tone}>{r.when}</Chip>
              </View>
            ))}
      </Card>
    </View>
  );
}
