/**
 * ReportDetail — the daily booklet report (role-aware).
 * Parent: read + Acknowledge & sign-off. Teacher: edit ratings + Send to parent.
 * Ported from screens-shared.jsx ReportDetail.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import {
  Avatar,
  Card,
  Chip,
  IconTile,
  SectionLabel,
  RatingDots,
  RatingBadge,
  VoiceNote,
  RATING,
} from '../design/components';
import { Icon } from '../design/Icon';
import { toneColors } from '../design/theme';
import {
  CHILD,
  TODAY,
  ATTENDANCE_TODAY,
  SUBJECTS_TODAY,
  RATINGS_TODAY,
  HOMEWORK,
  REMINDERS,
  TEACHER_NOTE,
  TEACHER,
} from '../mock/data';
import {
  useDaySummary,
  usePupilFeed,
  useAcknowledge,
  useCreateMessage,
  useSubjects,
  useUpsertDayNote,
} from '../hooks';
import { pupilsApi } from '../api';
import type { BehaviourLevel } from '@schoolbridge/types';

const OPTIONS = ['Needs Improvement', 'Good', 'Excellent'];

// Map API BehaviourLevel values to display strings used in mock
function levelToDisplay(value: 'NEEDS_WORK' | 'GOOD' | 'EXCELLENT'): string {
  if (value === 'NEEDS_WORK') return 'Needs Improvement';
  if (value === 'GOOD') return 'Good';
  return 'Excellent';
}

// Map display strings back to BehaviourLevel enum for the API
function displayToLevel(display: string): BehaviourLevel {
  if (display === 'Needs Improvement') return 'NEEDS_WORK';
  if (display === 'Good') return 'GOOD';
  return 'EXCELLENT';
}

export function ReportDetail({
  role,
  go,
  pupilId,
  child,
}: {
  role: 'parent' | 'teacher';
  go: (tab: string) => void;
  pupilId?: string;
  child?: { fullName: string; className?: string | null };
}) {
  const theme = useTheme();
  const teacher = role === 'teacher';

  const [ratings, setRatings] = useState<Record<string, string>>(() =>
    Object.fromEntries(RATINGS_TODAY.map((r) => [r.label, r.value])),
  );
  const [signed, setSigned] = useState(false);
  const [sent, setSent] = useState(false);

  // Teacher write mutation (for Send report to parent)
  const createMessage = useCreateMessage();

  // Teacher: add a per-subject lesson note (topic/note/score → /day-notes)
  const { data: subjects } = useSubjects();
  const upsertDayNote = useUpsertDayNote();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteSubjectId, setNoteSubjectId] = useState<string | null>(null);
  const [noteTopic, setNoteTopic] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteScore, setNoteScore] = useState('');

  const handleAddDayNote = async () => {
    if (!pupilId || !noteSubjectId || !noteTopic.trim()) return;
    const score = noteScore.trim() ? Number(noteScore) : undefined;
    try {
      await upsertDayNote.mutateAsync({
        pupilId,
        dto: {
          pupilId,
          subjectId: noteSubjectId,
          date: new Date(),
          topic: noteTopic.trim(),
          note: noteText.trim() || undefined,
          score: Number.isFinite(score) ? score : undefined,
          maxScore: Number.isFinite(score) ? 10 : undefined,
        },
      });
      setNoteOpen(false);
      setNoteTopic('');
      setNoteText('');
      setNoteScore('');
      setNoteSubjectId(null);
    } catch {
      // best-effort; keep form open on error
    }
  };

  // Live hooks (parent path only — teacher branch stays on mocks)
  const { data: daySummary } = useDaySummary(pupilId);
  const feedQuery = usePupilFeed(pupilId ?? '');
  const feedItems = pupilId
    ? (feedQuery.data?.pages ?? []).flatMap((p) => p.items)
    : [];

  // First feed message to use as the "acknowledge" target
  const firstFeedId = feedItems[0]?.id ?? '';
  const acknowledgeMutation = useAcknowledge(firstFeedId, pupilId ?? '');

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
  const liveAtt = daySummary?.attendance;
  const attStatus = liveAtt?.status
    ? liveAtt.status.charAt(0) + liveAtt.status.slice(1).toLowerCase()
    : ATTENDANCE_TODAY.status;
  const attArrived = liveAtt?.arrivedAt
    ? new Date(liveAtt.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ATTENDANCE_TODAY.arrived;
  const attMood = liveAtt?.mood ?? ATTENDANCE_TODAY.mood;

  // Subjects
  const liveSubjects = daySummary?.subjects ?? [];
  const subjectsToRender = liveSubjects.length > 0
    ? liveSubjects.map((s) => ({
        subj: s.subject,
        topic: s.topic,
        note: s.note ?? '',
        scoreStr: s.score != null && s.maxScore != null ? `${s.score}/${s.maxScore}` : null,
      }))
    : SUBJECTS_TODAY.map((s) => ({
        subj: s.subj,
        topic: s.topic,
        note: s.note,
        scoreStr: s.score,
      }));

  // Ratings (parent view only reads them; teacher edits local state)
  const liveRatings = daySummary?.ratings ?? [];
  const ratingsToRender = liveRatings.length > 0
    ? liveRatings.map((r) => ({
        label: r.label,
        icon: 'star' as string,
        value: levelToDisplay(r.value),
      }))
    : RATINGS_TODAY;

  // Teacher note: first NOTE-type feed item body
  const liveNote = feedItems.find((m) => m.type === 'NOTE')?.body;
  const teacherNote = liveNote ?? TEACHER_NOTE;

  // Reminders: EVENT | FEE_REMINDER | ANNOUNCEMENT feed items
  const liveReminders = feedItems.filter(
    (m) => m.type === 'EVENT' || m.type === 'FEE_REMINDER' || m.type === 'ANNOUNCEMENT',
  );

  // Homework due from feed
  const liveDue = feedItems.filter((m) => m.type === 'HOMEWORK' && !m.submitted);

  // Acknowledge handler (parent)
  const handleAcknowledge = () => {
    if (firstFeedId && pupilId) {
      acknowledgeMutation.mutate();
    }
    setSigned(true);
  };

  // Teacher: send behaviour ratings + notify parent via NOTE message
  const handleSendReport = async () => {
    if (pupilId) {
      const ratingEntries = Object.entries(ratings).map(([label, value]) => ({
        label,
        value: displayToLevel(value),
      }));
      try {
        await pupilsApi.upsertBehaviour(pupilId, {
          pupilId,
          date: new Date(),
          ratings: ratingEntries,
        });
      } catch {
        // best-effort; proceed to mark sent
      }
      // Optionally notify parent with a NOTE message
      const childDisplay = child?.fullName ?? CHILD.name;
      try {
        await createMessage.mutateAsync({
          type: 'NOTE',
          target: 'PUPIL',
          pupilId,
          title: `Daily report for ${childDisplay}`,
          body: teacherNote,
          attachments: [],
        });
      } catch {
        // best-effort
      }
    }
    setSent(true);
  };

  return (
    <View>
      {/* Context banner */}
      <Card style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <Avatar initials={childInitials} hue={childHue} size={48} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontWeight: '800', fontSize: 17, color: theme.text }}>{childName}</Text>
          <Text style={{ fontSize: 13, color: theme.muted }}>
            {childClass} · {TODAY}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Chip icon="check" tone="green">
            {attStatus}
          </Chip>
          <Text style={{ fontSize: 11.5, color: theme.muted2, marginTop: 4 }}>in {attArrived}</Text>
        </View>
      </Card>

      {/* Mood strip */}
      <Card
        pad={14}
        style={{
          marginBottom: 18,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: theme.primarySoft,
          borderColor: 'transparent',
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: theme.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="smile" size={22} stroke={2} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12.5, color: theme.primaryInk, fontWeight: '600' }}>Overall mood today</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.primaryInk }}>
            {attMood ?? 'Cheerful'} &amp; engaged
          </Text>
        </View>
      </Card>

      {/* Academic progress */}
      <SectionLabel>Academic progress</SectionLabel>
      <Card pad={0} style={{ marginBottom: 18, overflow: 'hidden' }}>
        {subjectsToRender.map((s, i) => (
          <View
            key={s.subj}
            style={{
              flexDirection: 'row',
              gap: 12,
              padding: 14,
              alignItems: 'flex-start',
              borderTopWidth: i ? 1 : 0,
              borderTopColor: theme.border2,
            }}
          >
            {/* Use index-based fallback icon/tone when rendering live subjects */}
            <IconTile
              icon={SUBJECTS_TODAY[i]?.icon ?? 'report'}
              tone={SUBJECTS_TODAY[i]?.tone ?? 'primary'}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '700', fontSize: 15, color: theme.text }}>{s.subj}</Text>
              <Text style={{ fontSize: 13.5, color: theme.muted, marginTop: 1 }}>{s.topic}</Text>
              {s.note ? (
                <Text style={{ fontSize: 12.5, color: theme.muted2, marginTop: 3 }}>{s.note}</Text>
              ) : null}
            </View>
            {s.scoreStr ? (
              <Text style={{ fontWeight: '800', fontSize: 15, color: theme.green }}>{s.scoreStr}</Text>
            ) : null}
          </View>
        ))}
      </Card>

      {/* Teacher: add a lesson note for a subject */}
      {teacher && pupilId ? (
        <View style={{ marginBottom: 18 }}>
          {!noteOpen ? (
            <Pressable
              onPress={() => setNoteOpen(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                paddingVertical: 11,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
              }}
            >
              <Icon name="plus" size={17} stroke={2.4} color={theme.primary} />
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.primary }}>Add lesson note</Text>
            </Pressable>
          ) : (
            <Card style={{ backgroundColor: theme.primarySoft, borderColor: 'transparent' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primaryInk, marginBottom: 8 }}>
                Lesson note
              </Text>
              {subjects && subjects.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                  {subjects.map((sub) => {
                    const on = noteSubjectId === sub.id;
                    return (
                      <Pressable
                        key={sub.id}
                        onPress={() => setNoteSubjectId(sub.id)}
                        style={{ paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, backgroundColor: on ? theme.primary : theme.surface }}
                      >
                        <Text style={{ fontSize: 12.5, fontWeight: '700', color: on ? '#fff' : theme.muted }}>{sub.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={{ fontSize: 12.5, color: theme.muted, marginBottom: 10 }}>
                  No subjects yet — add one from the Subjects screen.
                </Text>
              )}
              <TextInput
                value={noteTopic}
                onChangeText={setNoteTopic}
                placeholder="Topic (e.g. Long division)"
                placeholderTextColor={theme.muted2}
                style={{ backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: theme.text }}
              />
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Note (optional)"
                placeholderTextColor={theme.muted2}
                style={{ marginTop: 9, backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: theme.text }}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 9, alignItems: 'center' }}>
                <TextInput
                  value={noteScore}
                  onChangeText={setNoteScore}
                  placeholder="Score / 10"
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor={theme.muted2}
                  style={{ width: 110, backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: theme.text }}
                />
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => setNoteOpen(false)} style={{ paddingVertical: 9, paddingHorizontal: 14 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.muted }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => { void handleAddDayNote(); }}
                  disabled={!noteSubjectId || !noteTopic.trim() || upsertDayNote.isPending}
                  style={{ backgroundColor: theme.primary, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999, opacity: !noteSubjectId || !noteTopic.trim() ? 0.5 : 1 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>
                    {upsertDayNote.isPending ? 'Saving…' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}
        </View>
      ) : null}

      {/* Participation & behaviour */}
      <SectionLabel>Participation &amp; behaviour</SectionLabel>
      <Card pad={4} style={{ marginBottom: 18 }}>
        {ratingsToRender.map((r, i) => (
          <View key={r.label} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: theme.border2 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                marginBottom: teacher ? 10 : 0,
              }}
            >
              <Icon name={r.icon} size={18} color={theme.muted} stroke={1.9} />
              <Text style={{ flex: 1, fontSize: 14.5, fontWeight: '600', color: theme.text }}>{r.label}</Text>
              {!teacher && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <RatingDots value={ratings[r.label] ?? r.value} />
                  <RatingBadge value={ratings[r.label] ?? r.value} small />
                </View>
              )}
            </View>
            {teacher && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {OPTIONS.map((o) => {
                  const on = ratings[r.label] === o;
                  const tone = RATING[o]?.v ?? 'primary';
                  const { fg, soft } = toneColors(theme, tone);
                  return (
                    <Pressable
                      key={o}
                      onPress={() => setRatings((prev) => ({ ...prev, [r.label]: o }))}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 7,
                        paddingHorizontal: 4,
                        borderRadius: 10,
                        backgroundColor: on ? soft : theme.surface2,
                        borderWidth: 1.5,
                        borderColor: on ? fg : theme.border,
                      }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: on ? fg : theme.muted2 }}>
                        {o === 'Needs Improvement' ? 'Needs work' : o}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </Card>

      {/* Homework & reminders preview */}
      <SectionLabel action={!teacher ? 'See all' : null} onAction={() => go('homework')}>
        Homework &amp; reminders
      </SectionLabel>
      <Card pad={4} style={{ marginBottom: 18 }}>
        {(liveDue.length > 0
          ? liveDue.slice(0, 2).map((h, i) => (
              <View
                key={h.id}
                style={{
                  flexDirection: 'row',
                  gap: 11,
                  alignItems: 'center',
                  padding: 12,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: theme.border2,
                }}
              >
                <IconTile icon="report" tone="primary" size={34} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{h.title}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 13, color: theme.muted }}>
                    {h.body ?? ''}
                  </Text>
                </View>
                {h.dueAt ? (
                  <Chip tone="amber">
                    {new Date(h.dueAt).toLocaleDateString([], {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Chip>
                ) : null}
              </View>
            ))
          : HOMEWORK.filter((h) => !h.done)
              .slice(0, 2)
              .map((h, i) => (
                <View
                  key={h.id}
                  style={{
                    flexDirection: 'row',
                    gap: 11,
                    alignItems: 'center',
                    padding: 12,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: theme.border2,
                  }}
                >
                  <IconTile icon={h.icon} tone="primary" size={34} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{h.subj}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: theme.muted }}>
                      {h.task}
                    </Text>
                  </View>
                  <Chip tone="amber">{h.due}</Chip>
                </View>
              )))}
        {(liveReminders.length > 0
          ? liveReminders.slice(0, 2).map((r) => (
              <View
                key={r.id}
                style={{
                  flexDirection: 'row',
                  gap: 11,
                  alignItems: 'center',
                  padding: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.border2,
                }}
              >
                <IconTile icon="calendar" tone="primary" size={34} />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.text }}>{r.title}</Text>
                {r.dueAt ? (
                  <Chip tone="primary">
                    {new Date(r.dueAt).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Chip>
                ) : null}
              </View>
            ))
          : REMINDERS.slice(0, 2).map((r) => (
              <View
                key={r.id}
                style={{
                  flexDirection: 'row',
                  gap: 11,
                  alignItems: 'center',
                  padding: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.border2,
                }}
              >
                <IconTile icon={r.icon} tone={r.tone} size={34} />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.text }}>{r.text}</Text>
                <Chip tone={r.tone}>{r.when}</Chip>
              </View>
            )))}
      </Card>

      {/* Teacher's note */}
      <SectionLabel>{teacher ? 'Your note to parent' : 'Note from teacher'}</SectionLabel>
      <Card style={{ marginBottom: 18 }}>
        {!teacher && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 }}>
            <Avatar initials={TEACHER.initials} hue={200} size={34} />
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.text }}>{TEACHER.name}</Text>
          </View>
        )}
        <Text style={{ fontSize: 14.5, lineHeight: 22, color: theme.text }}>{teacherNote}</Text>
        <View
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 14,
            backgroundColor: theme.surface2,
            borderWidth: 1,
            borderColor: theme.border2,
          }}
        >
          {teacher ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="mic" size={18} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13.5 }}>
                Voice note attached · 0:38
              </Text>
              <Text style={{ marginLeft: 'auto', color: theme.muted2, fontWeight: '600', fontSize: 13 }}>
                Re-record
              </Text>
            </View>
          ) : (
            <VoiceNote duration="0:38" />
          )}
        </View>
      </Card>

      {/* Sign-off / send */}
      {teacher ? (
        <Pressable
          onPress={() => { void handleSendReport(); }}
          disabled={sent || createMessage.isPending}
          style={{
            backgroundColor: sent ? theme.green : theme.primary,
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            ...(theme.shadow as object),
          }}
        >
          <Icon name={sent ? 'check' : 'send'} size={20} stroke={2.4} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {sent ? 'Report sent to parent' : createMessage.isPending ? 'Sending…' : 'Send report to parent'}
          </Text>
        </Pressable>
      ) : (
        <Card style={{ backgroundColor: signed ? theme.greenSoft : theme.surface }}>
          {signed ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <Icon name="checkCircle" size={26} stroke={2} color={theme.green} />
              <View>
                <Text style={{ fontWeight: '800', fontSize: 15, color: theme.green }}>Report acknowledged</Text>
                <Text style={{ fontSize: 13, color: theme.green, opacity: 0.85 }}>Mrs. Okafor · just now</Text>
              </View>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 13.5, color: theme.muted, marginBottom: 12 }}>
                Let {childFirst}'s teacher know you've seen today's report.
              </Text>
              <Pressable
                onPress={handleAcknowledge}
                style={{
                  backgroundColor: theme.primary,
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                }}
              >
                <Icon name="check" size={19} stroke={2.4} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15.5 }}>Acknowledge &amp; sign off</Text>
              </Pressable>
            </View>
          )}
        </Card>
      )}
    </View>
  );
}
