/**
 * ResultsScreen — per-subject score entry for a class.
 * Pick a subject, enter a numeric score (0–100) for each pupil, then save.
 * Rendered inside AppShell's ScrollView + header — do NOT add ScrollView/SafeArea.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Card, Chip, SectionLabel } from '../design/components';
import { Icon } from '../design/Icon';
import { useClassPupils, useSubjects, useCurrentTermId, useUpsertResult } from '../hooks';
import type { RosterPupil } from '../api';
import type { Subject } from '../api';

export function ResultsScreen({
  classId,
  className,
  onDone,
}: {
  classId?: string;
  className?: string;
  onDone: () => void;
}) {
  const theme = useTheme();

  const { data: pupils, isLoading: loadingPupils } = useClassPupils(classId ?? null);
  const { data: subjects, isLoading: loadingSubjects } = useSubjects();
  const termId = useCurrentTermId();
  const upsertResult = useUpsertResult();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  // Map pupilId -> score string
  const [scores, setScores] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const activeSubject =
    subjects?.find((s: Subject) => s.id === selectedSubjectId) ??
    subjects?.[0] ??
    null;

  // Auto-select first subject when list loads
  React.useEffect(() => {
    if (!selectedSubjectId && subjects && subjects.length > 0) {
      setSelectedSubjectId(subjects[0]!.id);
    }
  }, [subjects, selectedSubjectId]);

  // Reset scores when subject changes
  function selectSubject(id: string) {
    setSelectedSubjectId(id);
    setScores({});
    setDone(false);
  }

  function setScore(pupilId: string, value: string) {
    setScores((prev) => ({ ...prev, [pupilId]: value }));
  }

  async function handleSave() {
    if (!classId || !termId || !activeSubject || !pupils || pupils.length === 0) return;

    const entries = pupils
      .map((p: RosterPupil) => ({ pupilId: p.id, scoreStr: scores[p.id] ?? '' }))
      .filter(({ scoreStr }) => scoreStr.trim() !== '' && !isNaN(Number(scoreStr)));

    if (entries.length === 0) return;

    try {
      await Promise.allSettled(
        entries.map(({ pupilId, scoreStr }) =>
          upsertResult.mutateAsync({
            termId: termId!,
            pupilId,
            subjectId: activeSubject.id,
            score: Number(scoreStr),
            maxScore: 100,
          }),
        ),
      );
      setDone(true);
      onDone();
    } catch {
      // Promise.allSettled won't throw; onDone on partial success is still fine
    }
  }

  const noClassOrTerm = !classId || !termId;
  const hasSubjects = subjects && subjects.length > 0;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loadingPupils || loadingSubjects) {
    return (
      <View style={{ paddingTop: 32, alignItems: 'center' }}>
        <Text style={{ color: theme.muted, fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  // ── Guard: no class/term ────────────────────────────────────────────────────
  if (noClassOrTerm) {
    return (
      <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="report" size={20} color={theme.amber} />
          <Text style={{ color: theme.amber, fontWeight: '600', fontSize: 14, flex: 1 }}>
            No active class or term. Please set up a class and term in school settings.
          </Text>
        </View>
      </Card>
    );
  }

  // ── No subjects ─────────────────────────────────────────────────────────────
  if (!hasSubjects) {
    return (
      <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="book" size={20} color={theme.muted} />
          <Text style={{ color: theme.muted, fontWeight: '600', fontSize: 14, flex: 1 }}>
            No subjects yet — add one from the Subjects screen.
          </Text>
        </View>
      </Card>
    );
  }

  // ── Empty roster ─────────────────────────────────────────────────────────────
  if (!pupils || pupils.length === 0) {
    return (
      <View style={{ paddingTop: 40, alignItems: 'center', gap: 10 }}>
        <Icon name="user" size={36} color={theme.muted2} />
        <Text style={{ color: theme.muted, fontSize: 14.5, textAlign: 'center' }}>
          No pupils enrolled in this class.
        </Text>
      </View>
    );
  }

  const filledCount = Object.values(scores).filter(
    (v) => v.trim() !== '' && !isNaN(Number(v)),
  ).length;
  const canSave = filledCount > 0 && !!activeSubject && !upsertResult.isPending;

  return (
    <View>
      {/* Subject picker */}
      <SectionLabel>Subject</SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4, paddingHorizontal: 2 }}
        style={{ marginBottom: 18 }}
      >
        {(subjects as Subject[]).map((subj: Subject) => {
          const isActive = subj.id === (activeSubject?.id ?? null);
          return (
            <Pressable key={subj.id} onPress={() => selectSubject(subj.id)}>
              <Chip
                tone="primary"
                icon="book"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  opacity: isActive ? 1 : 0.4,
                }}
              >
                {subj.name}
              </Chip>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Score entry */}
      <SectionLabel>
        {className ? `${className} · ` : ''}Scores — {activeSubject?.name ?? ''}
      </SectionLabel>

      <Card pad={4} style={{ marginBottom: 18 }}>
        {pupils.map((pupil: RosterPupil, idx: number) => {
          const scoreVal = scores[pupil.id] ?? '';
          const numVal = Number(scoreVal);
          const isValid = scoreVal.trim() !== '' && !isNaN(numVal) && numVal >= 0 && numVal <= 100;
          const isOver = scoreVal.trim() !== '' && !isNaN(numVal) && numVal > 100;

          return (
            <View
              key={pupil.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: theme.border2,
              }}
            >
              {/* Pupil name */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 14.5, fontWeight: '700', color: theme.text }}
                >
                  {pupil.fullName}
                </Text>
                {pupil.admissionNo ? (
                  <Text style={{ fontSize: 12, color: theme.muted }}>{pupil.admissionNo}</Text>
                ) : null}
              </View>

              {/* Score input */}
              <View style={{ alignItems: 'flex-end' }}>
                <TextInput
                  value={scoreVal}
                  onChangeText={(v) => setScore(pupil.id, v)}
                  placeholder="—"
                  placeholderTextColor={theme.muted2}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 15,
                    fontWeight: '700',
                    color: isOver ? theme.red : theme.text,
                    textAlign: 'center',
                    width: 62,
                    borderWidth: 1,
                    borderColor: isValid ? theme.primary : isOver ? theme.red : theme.border,
                  }}
                />
                <Text style={{ fontSize: 10.5, color: theme.muted2, marginTop: 2 }}>/ 100</Text>
              </View>
            </View>
          );
        })}
      </Card>

      {/* Filled count helper */}
      {filledCount > 0 ? (
        <Text style={{ color: theme.muted, fontSize: 13, textAlign: 'center', marginBottom: 10 }}>
          {filledCount} of {pupils.length} scores entered
        </Text>
      ) : null}

      {/* Save button */}
      <Pressable
        onPress={() => { void handleSave(); }}
        disabled={!canSave}
        style={{
          backgroundColor: canSave ? theme.primary : theme.muted2,
          paddingVertical: 14,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          marginBottom: 8,
          ...(theme.shadow as object),
        }}
      >
        <Icon name="send" size={18} stroke={2.2} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15.5 }}>
          {upsertResult.isPending ? 'Saving results…' : 'Save results'}
        </Text>
      </Pressable>

      {upsertResult.isError ? (
        <Text style={{ color: theme.red, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
          Some results failed to save. Please retry.
        </Text>
      ) : null}
    </View>
  );
}
