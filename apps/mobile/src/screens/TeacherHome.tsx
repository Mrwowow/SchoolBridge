/**
 * TeacherHome — class dashboard: summary, quick actions, roster.
 * Ported from screens-teacher.jsx TeacherHome.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Avatar, Card, Chip, SectionLabel, Bar } from '../design/components';
import { Icon } from '../design/Icon';
import type { Tone } from '../design/theme';
import { TODAY, TEACHER, ROSTER } from '../mock/data';
import { useReportStatus } from '../hooks';
import type { SelectedPupil } from './AppShell';

type TeacherView = 'attendance' | 'results' | 'subjects';

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

interface RosterRow {
  pupilId?: string;
  name: string;
  initials: string;
  subtitle: string;
  reportSent: boolean;
  hue: number;
}

export function TeacherHome({
  go,
  classId,
  className,
  onSelectPupil,
  onOpenView,
}: {
  go: (tab: string) => void;
  classId?: string;
  className?: string;
  onSelectPupil?: (p: SelectedPupil) => void;
  onOpenView?: (v: TeacherView) => void;
}) {
  const theme = useTheme();

  const { data: status } = useReportStatus(classId ?? null);
  const live = status && status.pupils.length > 0;

  const rosterRows: RosterRow[] = live
    ? status!.pupils.map((p) => ({
        pupilId: p.pupilId,
        name: p.fullName,
        initials: deriveInitials(p.fullName),
        subtitle: p.attendance
          ? `${p.attendance[0]}${p.attendance.slice(1).toLowerCase()}${p.mood ? ` · ${p.mood}` : ''}`
          : 'Awaiting register',
        reportSent: p.reportSent,
        hue: stableHue(p.pupilId),
      }))
    : ROSTER.map((r) => ({
        name: r.name,
        initials: r.initials,
        subtitle: r.mood !== '—' ? r.mood : 'Awaiting report',
        reportSent: r.status === 'sent',
        hue: r.hue,
      }));

  const klassName = className ?? TEACHER.klass;

  const total = live ? status!.total : 28;
  const present = live ? status!.present : 26;
  const absent = live ? status!.absent : 2;
  const sent = live ? status!.reportsSent : ROSTER.filter((r) => r.status === 'sent').length;

  // Quick actions: tab targets ('report'/'homework'/'messages') or a teacher
  // full-screen view ('attendance'/'results'/'subjects').
  const actions: { icon: string; label: string; onPress: () => void }[] = [
    { icon: 'check', label: 'Attendance', onPress: () => onOpenView?.('attendance') },
    { icon: 'report', label: 'Results', onPress: () => onOpenView?.('results') },
    { icon: 'homework', label: 'Assign work', onPress: () => go('homework') },
    { icon: 'book', label: 'Subjects', onPress: () => onOpenView?.('subjects') },
  ];

  return (
    <View>
      {/* Class summary */}
      <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ backgroundColor: theme.primary, padding: 18 }}>
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600', opacity: 0.92 }}>{TODAY}</Text>
          <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 3 }}>{klassName}</Text>
          <View style={{ flexDirection: 'row', gap: 22, marginTop: 16 }}>
            {[
              [String(total), 'Pupils'],
              [String(present), 'Present'],
              [String(absent), 'Absent'],
            ].map(([n, l]) => (
              <View key={l}>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{n}</Text>
                <Text style={{ color: '#fff', fontSize: 11.5, opacity: 0.88 }}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ padding: 18, paddingVertical: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.text }}>Daily reports sent</Text>
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: theme.primary }}>{sent} / {total}</Text>
          </View>
          <Bar pct={total > 0 ? (sent / total) * 100 : 0} />
        </View>
      </Card>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        {actions.map((a) => (
          <Card
            key={a.label}
            style={{ width: '47%', flexGrow: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 }}
            onPress={a.onPress}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Icon name={a.icon} size={20} stroke={2} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>{a.label}</Text>
          </Card>
        ))}
      </View>

      {/* Roster */}
      <SectionLabel>Today's pupils</SectionLabel>
      <Card pad={4}>
        {rosterRows.map((p, i) => (
          <Pressable
            key={p.pupilId ?? p.name}
            onPress={() =>
              p.pupilId && onSelectPupil
                ? onSelectPupil({ id: p.pupilId, fullName: p.name })
                : go('report')
            }
            style={{
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              paddingVertical: 11,
              paddingHorizontal: 12,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: theme.border2,
            }}
          >
            <Avatar initials={p.initials} hue={p.hue} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: theme.text }}>{p.name}</Text>
              <Text style={{ fontSize: 12.5, color: theme.muted }}>{p.subtitle}</Text>
            </View>
            <Chip tone={p.reportSent ? 'green' : 'amber'}>{p.reportSent ? 'Sent' : 'Pending'}</Chip>
            <Icon name="chevR" size={17} color={theme.muted2} />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
