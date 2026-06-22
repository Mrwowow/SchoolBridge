/**
 * ProfileScreen — progress over time: hero stats, subject bars, behaviour trend,
 * attendance, milestones. Ported from screens-shared.jsx ProfileScreen.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Avatar, Card, Chip, IconTile, SectionLabel, Bar } from '../design/components';
import { Icon } from '../design/Icon';
import { CHILD, PROGRESS } from '../mock/data';
import { useProgress } from '../hooks';

export function ProfileScreen({
  pupilId,
  child,
}: {
  pupilId?: string;
  child?: { fullName: string; className?: string | null };
}) {
  const theme = useTheme();
  const { data: progressData } = useProgress(pupilId);
  const maxB = 5;

  // Progress fields with fallbacks
  const termAvg = progressData?.termAvg ?? PROGRESS.termAvg;
  const grade = progressData?.grade ?? PROGRESS.grade;
  const position = progressData?.position ?? PROGRESS.position;
  const attendance = progressData?.attendance ?? PROGRESS.attendance;
  const attendanceDays = progressData?.attendanceDays ?? PROGRESS.attendanceDays;
  const subjects =
    progressData?.subjects && progressData.subjects.length > 0
      ? progressData.subjects
      : PROGRESS.subjects.map((s) => ({ subject: s.subj, pct: s.pct }));
  const behaviourWeeks =
    progressData?.behaviourWeeks && progressData.behaviourWeeks.length > 0
      ? progressData.behaviourWeeks
      : PROGRESS.behaviorWeeks;
  const badges =
    progressData?.badges && progressData.badges.length > 0
      ? progressData.badges
      : PROGRESS.badges.map((b) => ({ icon: b.icon, label: b.label, sub: b.sub }));

  // Child identity
  const childName = child?.fullName ?? CHILD.name;
  const childClass = child?.className ?? CHILD.klass;
  // age is not on ChildSummary — always fall back to mock
  const childAge = CHILD.age;
  const childInitials = childName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const childHue = CHILD.hue;

  return (
    <View>
      {/* Hero */}
      <Card style={{ marginBottom: 16, alignItems: 'center', paddingTop: 22, paddingBottom: 20 }}>
        <Avatar initials={childInitials} hue={childHue} size={76} ring />
        <Text style={{ fontSize: 21, fontWeight: '800', color: theme.text, marginTop: 12 }}>{childName}</Text>
        <Text style={{ fontSize: 13.5, color: theme.muted, marginTop: 2 }}>
          {childClass} · Age {childAge}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, alignSelf: 'stretch' }}>
          {[
            ['Term avg.', `${termAvg}%`],
            ['Position', position ?? '—'],
            ['Attendance', `${attendance}%`],
          ].map(([k, v]) => (
            <View
              key={k}
              style={{
                flex: 1,
                backgroundColor: theme.surface2,
                borderRadius: 14,
                paddingVertical: 11,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.primary }}>{v}</Text>
              <Text style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{k}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 12 }}>
          <Chip icon="trophy" tone="green">
            {grade}
          </Chip>
        </View>
      </Card>

      {/* Subject performance */}
      <SectionLabel>Subject performance — this term</SectionLabel>
      <Card style={{ marginBottom: 18 }}>
        {subjects.map((s, i) => {
          const tone = s.pct >= 85 ? 'green' : s.pct >= 75 ? 'primary' : 'amber';
          // subject name comes from API as `subject`; mock uses `subj` — normalised above
          const label = 'subject' in s ? s.subject : (s as { subj: string }).subj;
          return (
            <View key={label} style={{ marginTop: i ? 14 : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.text }}>{label}</Text>
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: theme.text }}>{s.pct}%</Text>
              </View>
              <Bar pct={s.pct} tone={tone} />
            </View>
          );
        })}
      </Card>

      {/* Behaviour trend */}
      <SectionLabel>Behaviour trend — last 6 weeks</SectionLabel>
      <Card style={{ marginBottom: 18 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 8,
            height: 110,
            paddingTop: 4,
          }}
        >
          {behaviourWeeks.map((b, i) => (
            <View
              key={i}
              style={{ flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  width: '100%',
                  maxWidth: 26,
                  height: (b / maxB) * 86,
                  borderRadius: 8,
                  backgroundColor:
                    i === behaviourWeeks.length - 1 ? theme.primary : theme.primarySoft,
                }}
              />
              <Text style={{ fontSize: 10.5, color: theme.muted2, fontWeight: '600' }}>W{i + 1}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }}>
          <Icon name="arrowUp" size={15} stroke={2.2} color={theme.green} />
          <Text style={{ fontSize: 12.5, color: theme.green, fontWeight: '600' }}>
            Trending up — most consistent week yet
          </Text>
        </View>
      </Card>

      {/* Attendance */}
      <Card style={{ marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <IconTile icon="calendar" tone="green" size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Attendance this term</Text>
          <Text style={{ fontSize: 13, color: theme.muted }}>{attendanceDays} present</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: theme.green }}>{attendance}%</Text>
      </Card>

      {/* Milestones */}
      <SectionLabel>Milestones</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {badges.map((b) => (
          <Card key={b.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                backgroundColor: theme.amberSoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Icon name={b.icon} size={20} stroke={2} color={theme.amber} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, textAlign: 'center' }}>
              {b.label}
            </Text>
            {b.sub ? (
              <Text style={{ fontSize: 11, color: theme.muted2, marginTop: 2 }}>{b.sub}</Text>
            ) : null}
          </Card>
        ))}
      </View>
    </View>
  );
}
