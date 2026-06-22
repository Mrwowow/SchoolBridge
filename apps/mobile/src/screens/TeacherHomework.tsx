/**
 * TeacherHomework — assign homework + track class submissions.
 * Ported from screens-teacher.jsx TeacherHomework.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Card, Chip, IconTile, SectionLabel, Bar } from '../design/components';
import { Icon } from '../design/Icon';
import { CLASS_HW } from '../mock/data';
import { useHomeworkStatus, useCreateMessage } from '../hooks';

function formatDueDate(iso: string | null): string {
  if (!iso) return 'No due date';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export function TeacherHomework({
  classId,
  className,
}: {
  classId?: string;
  className?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [task, setTask] = useState('');
  // Due-date as a quick-pick offset in days from today (null = no due date).
  const [dueDays, setDueDays] = useState<number | null>(1);

  const { data: liveHw } = useHomeworkStatus(classId ?? null);
  const createMessage = useCreateMessage();

  const DUE_OPTIONS: { label: string; days: number | null }[] = [
    { label: 'Tomorrow', days: 1 },
    { label: 'In 3 days', days: 3 },
    { label: 'Next week', days: 7 },
    { label: 'No due date', days: null },
  ];

  function dueAtFrom(days: number | null): Date | undefined {
    if (days === null) return undefined;
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(8, 0, 0, 0);
    return d;
  }

  const hwRows =
    liveHw && liveHw.length > 0
      ? liveHw.map((h) => ({
          key: h.messageId,
          subj: h.title || 'Homework',
          icon: 'report',
          task: h.title,
          due: formatDueDate(h.dueAt),
          submitted: h.submitted,
          total: h.total,
        }))
      : CLASS_HW.map((h) => ({ ...h, key: h.subj }));

  const formTitle = className ? `New assignment — ${className}` : 'New assignment';

  async function handlePost() {
    if (!classId) {
      // No classId — keep local no-op fallback
      setOpen(false);
      setSubject('');
      setTask('');
      return;
    }
    const title = subject.trim() || task.trim() || 'Homework';
    try {
      await createMessage.mutateAsync({
        type: 'HOMEWORK',
        target: 'CLASS',
        classId,
        title,
        body: task.trim() || undefined,
        dueAt: dueAtFrom(dueDays),
        attachments: [],
      });
    } catch {
      // ignore — query will refetch on success; on error keep form open
    }
    setOpen(false);
    setSubject('');
    setTask('');
    setDueDays(1);
  }

  return (
    <View>
      {/* Assign button */}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{
          backgroundColor: theme.primary,
          paddingVertical: 14,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          marginBottom: 18,
          ...(theme.shadow as object),
        }}
      >
        <Icon name="plus" size={20} stroke={2.6} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15.5 }}>Assign new homework</Text>
      </Pressable>

      {open && (
        <Card style={{ marginBottom: 18, backgroundColor: theme.primarySoft, borderColor: 'transparent' }}>
          <Text style={{ fontSize: 13.5, color: theme.primaryInk, fontWeight: '600' }}>{formTitle}</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject (e.g. Mathematics)"
            placeholderTextColor={theme.muted2}
            style={{ marginTop: 12, backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: theme.text }}
          />
          <TextInput
            value={task}
            onChangeText={setTask}
            placeholder="Describe the task…"
            placeholderTextColor={theme.muted2}
            style={{ marginTop: 10, backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, color: theme.text }}
          />
          {/* Due-date quick picks */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primaryInk, marginTop: 14, marginBottom: 8 }}>
            Due date
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DUE_OPTIONS.map((o) => {
              const on = dueDays === o.days;
              return (
                <Pressable
                  key={o.label}
                  onPress={() => setDueDays(o.days)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: on ? theme.primary : theme.surface,
                  }}
                >
                  <Icon name="calendar" size={13} stroke={2} color={on ? '#fff' : theme.muted} />
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: on ? '#fff' : theme.muted }}>
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 14, alignItems: 'center' }}>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => { void handlePost(); }}
              disabled={createMessage.isPending}
              style={{ backgroundColor: theme.primary, paddingVertical: 9, paddingHorizontal: 20, borderRadius: 999 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>
                {createMessage.isPending ? 'Posting…' : 'Post'}
              </Text>
            </Pressable>
          </View>
        </Card>
      )}

      <SectionLabel>Assigned · awaiting submission</SectionLabel>
      <View style={{ gap: 10, marginBottom: 18 }}>
        {hwRows.map((h) => {
          const ratio = h.total > 0 ? h.submitted / h.total : 0;
          return (
            <Card key={h.key} pad={15}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <IconTile icon={h.icon} tone="primary" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: theme.text }}>{h.subj}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 13, color: theme.muted }}>
                    {h.task}
                  </Text>
                </View>
                <Chip tone="amber">{h.due}</Chip>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: theme.muted, fontWeight: '600' }}>Submitted</Text>
                <Text style={{ fontSize: 12, color: theme.text, fontWeight: '800' }}>
                  {h.submitted} / {h.total}
                </Text>
              </View>
              <Bar pct={ratio * 100} tone={ratio > 0.6 ? 'green' : 'primary'} height={7} />
            </Card>
          );
        })}
      </View>
    </View>
  );
}
