/**
 * ParentHome — today hero, quick stats, homework due, teacher message preview.
 * Ported from the mockup's ParentHome (screens-parent.jsx).
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Avatar, Card, Chip, IconTile, SectionLabel } from '../design/components';
import { Icon } from '../design/Icon';
import { toneColors, type Tone } from '../design/theme';
import { CHILD, TODAY, ATTENDANCE_TODAY, HOMEWORK, MESSAGES, PROGRESS, TEACHER } from '../mock/data';
import { useDaySummary, useProgress, usePupilFeed } from '../hooks';
import type { ChildSummary } from '@schoolbridge/types';

export function ParentHome({
  go,
  pupilId,
  child,
}: {
  go: (tab: string) => void;
  pupilId?: string;
  child?: ChildSummary;
}) {
  const theme = useTheme();

  // Live hooks (disabled when no pupilId)
  const { data: daySummary } = useDaySummary(pupilId);
  const { data: progressData } = useProgress(pupilId);
  const feedQuery = usePupilFeed(pupilId ?? '');
  const feedItems = pupilId
    ? (feedQuery.data?.pages ?? []).flatMap((p) => p.items)
    : [];

  // Child identity
  const childName = child?.fullName ?? CHILD.name;
  const childFirst = childName.split(' ')[0] ?? CHILD.first;
  const childClass = child?.className ?? CHILD.klass;
  const childInitials = childName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const childHue = CHILD.hue;

  // Attendance
  const liveAttendance = daySummary?.attendance;
  const attendanceStatus = liveAttendance?.status
    ? liveAttendance.status.charAt(0) + liveAttendance.status.slice(1).toLowerCase()
    : ATTENDANCE_TODAY.status;
  const attendanceMood = liveAttendance?.mood ?? ATTENDANCE_TODAY.mood;

  // Homework due from feed
  const liveHomeworkDue = feedItems.filter(
    (m) => m.type === 'HOMEWORK' && !m.submitted,
  );
  const mockDue = HOMEWORK.filter((h) => !h.done);
  const due = liveHomeworkDue.length > 0 ? liveHomeworkDue : null;
  const dueCount = due ? due.length : mockDue.length;

  // Attendance % stat
  const attendancePct = progressData?.attendance ?? PROGRESS.attendance;

  // Last teacher message preview
  const liveLastMsg = feedItems.find((m) => !!m.body);
  const mockLastMsg = MESSAGES[MESSAGES.length - 1] ?? { text: '', time: '' };
  const lastMsgText = liveLastMsg?.body ?? mockLastMsg.text;
  const lastMsgTime = liveLastMsg
    ? new Date(liveLastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : mockLastMsg.time;

  // Subject count
  const subjectCount = daySummary?.subjects?.length ?? 5;

  const stats: { ic: string; tone: Tone; big: string; small: string; tab: string }[] = [
    { ic: 'star', tone: 'green', big: 'Excellent', small: 'Behaviour', tab: 'report' },
    { ic: 'homework', tone: 'primary', big: `${dueCount} due`, small: 'Homework', tab: 'homework' },
    { ic: 'calendar', tone: 'green', big: `${attendancePct}%`, small: 'Attendance', tab: 'profile' },
  ];

  // Render homework list — live items or mock
  const renderDueRows = () => {
    if (due && due.length > 0) {
      return due.map((h, i) => (
        <View
          key={h.id}
          style={{
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            padding: 12,
            borderTopWidth: i ? 1 : 0,
            borderTopColor: theme.border2,
          }}
        >
          <IconTile icon="report" tone="primary" size={36} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 14.5, fontWeight: '700', color: theme.text }}>{h.title}</Text>
            <Text numberOfLines={1} style={{ fontSize: 13, color: theme.muted }}>
              {h.body ?? ''}
            </Text>
          </View>
          {h.dueAt ? (
            <Chip tone="amber" style={{ paddingVertical: 4 }}>
              {new Date(h.dueAt).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
            </Chip>
          ) : null}
        </View>
      ));
    }
    // Fallback mock
    return mockDue.map((h, i) => (
      <View
        key={h.id}
        style={{
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
          padding: 12,
          borderTopWidth: i ? 1 : 0,
          borderTopColor: theme.border2,
        }}
      >
        <IconTile icon={h.icon} tone="primary" size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14.5, fontWeight: '700', color: theme.text }}>{h.subj}</Text>
          <Text numberOfLines={1} style={{ fontSize: 13, color: theme.muted }}>
            {h.task}
          </Text>
        </View>
        <Chip tone="amber" style={{ paddingVertical: 4 }}>
          {h.due}
        </Chip>
      </View>
    ));
  };

  return (
    <View>
      {/* Today hero */}
      <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }} onPress={() => go('report')}>
        <View style={{ backgroundColor: theme.primary, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Icon name="sparkle" size={15} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600', opacity: 0.92 }}>
              TODAY'S REPORT · {TODAY}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 14 }}>
            <Avatar initials={childInitials} hue={childHue} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 19 }}>{childFirst} had a great day</Text>
              <Text style={{ color: '#fff', fontSize: 13, opacity: 0.9, marginTop: 1 }}>{childClass}</Text>
            </View>
            <Icon name="chevR" size={22} color="rgba(255,255,255,0.8)" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {([
              ['check', attendanceStatus],
              ['smile', attendanceMood ?? 'Cheerful'],
              ['star', `${subjectCount} subjects`],
            ] as [string, string][]).map(([ic, tx]) => (
              <View
                key={tx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderRadius: 999,
                  paddingVertical: 5,
                  paddingHorizontal: 11,
                }}
              >
                <Icon name={ic} size={14} stroke={2.2} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>{tx}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13.5, color: theme.muted }}>Tap to read the full daily report</Text>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.primary }}>Open →</Text>
        </View>
      </Card>

      {/* Quick stats */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
        {stats.map((s) => {
          const { fg, soft } = toneColors(theme, s.tone);
          return (
            <Card key={s.small} pad={0} style={{ flex: 1 }} onPress={() => go(s.tab)}>
              <View style={{ padding: 11, paddingVertical: 13 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Icon name={s.ic} size={17} stroke={2} color={fg} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>{s.big}</Text>
                <Text style={{ fontSize: 11.5, color: theme.muted, marginTop: 2 }}>{s.small}</Text>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Homework due */}
      <SectionLabel action="See all" onAction={() => go('homework')}>
        Homework due
      </SectionLabel>
      <Card pad={4} style={{ marginBottom: 18 }}>
        {renderDueRows()}
      </Card>

      {/* Message preview */}
      <SectionLabel action="Open chat" onAction={() => go('messages')}>
        From the teacher
      </SectionLabel>
      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }} onPress={() => go('messages')}>
        <Avatar initials={TEACHER.initials} hue={200} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{TEACHER.name}</Text>
          <Text numberOfLines={1} style={{ fontSize: 13, color: theme.muted }}>
            {lastMsgText}
          </Text>
        </View>
        <Text style={{ fontSize: 11.5, color: theme.muted2 }}>{lastMsgTime}</Text>
      </Card>
    </View>
  );
}
