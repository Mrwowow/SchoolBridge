/**
 * AttendanceScreen — daily class register.
 * Mark each pupil PRESENT / ABSENT / LATE / EXCUSED then save in bulk.
 * Rendered inside AppShell's ScrollView + header — do NOT add ScrollView/SafeArea.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Card, SectionLabel } from '../design/components';
import { Icon } from '../design/Icon';
import { useClassPupils, useReportStatus, useBulkAttendance, useCurrentTermId } from '../hooks';
import type { RosterPupil } from '../api';

type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

const STATUS_LABELS: { key: AttStatus; short: string }[] = [
  { key: 'PRESENT', short: 'P' },
  { key: 'ABSENT', short: 'A' },
  { key: 'LATE', short: 'L' },
  { key: 'EXCUSED', short: 'E' },
];

function statusTone(s: AttStatus): { bg: string; text: string } | null {
  // Only used for the selected button; let the caller decide via theme
  return null;
}

export function AttendanceScreen({
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
  const { data: reportStatus } = useReportStatus(classId ?? null);
  const termId = useCurrentTermId();
  const bulkAttendance = useBulkAttendance();

  // Map pupilId -> selected status
  const [register, setRegister] = useState<Record<string, AttStatus>>({});

  // Pre-fill from today's existing statuses once both loads are done
  useEffect(() => {
    if (!pupils || pupils.length === 0) return;

    const prefilled: Record<string, AttStatus> = {};
    pupils.forEach((p: RosterPupil) => {
      const existing = reportStatus?.pupils.find((rp) => rp.pupilId === p.id);
      prefilled[p.id] = (existing?.attendance as AttStatus | null) ?? 'PRESENT';
    });
    setRegister(prefilled);
  }, [pupils, reportStatus]);

  function setStatus(pupilId: string, status: AttStatus) {
    setRegister((prev) => ({ ...prev, [pupilId]: status }));
  }

  async function handleSave() {
    if (!classId || !termId || !pupils || pupils.length === 0) return;

    const entries = pupils.map((p: RosterPupil) => ({
      pupilId: p.id,
      status: register[p.id] ?? 'PRESENT',
    }));

    try {
      await bulkAttendance.mutateAsync({
        termId,
        classRoomId: classId,
        date: new Date(),
        entries,
      });
      onDone();
    } catch {
      // keep the screen open so the teacher can retry
    }
  }

  const noClassOrTerm = !classId || !termId;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loadingPupils) {
    return (
      <View style={{ paddingTop: 32, alignItems: 'center' }}>
        <Text style={{ color: theme.muted, fontSize: 14 }}>Loading pupils…</Text>
      </View>
    );
  }

  // ── Guard: no class / term ───────────────────────────────────────────────────
  if (noClassOrTerm) {
    return (
      <Card style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="calendar" size={20} color={theme.amber} />
          <Text style={{ color: theme.amber, fontWeight: '600', fontSize: 14, flex: 1 }}>
            No active class or term. Please set up a class and term in school settings.
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

  // ── Legend chip row ─────────────────────────────────────────────────────────
  const legend: { key: AttStatus; label: string; fg: string; bg: string }[] = [
    { key: 'PRESENT', label: 'Present', fg: theme.green, bg: theme.greenSoft },
    { key: 'ABSENT', label: 'Absent', fg: theme.red, bg: theme.redSoft },
    { key: 'LATE', label: 'Late', fg: theme.amber, bg: theme.amberSoft },
    { key: 'EXCUSED', label: 'Excused', fg: theme.muted, bg: theme.border },
  ];

  const presentCount = Object.values(register).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(register).filter((s) => s === 'ABSENT').length;

  return (
    <View>
      {/* Summary strip */}
      <Card pad={14} style={{ marginBottom: 16, flexDirection: 'row', gap: 0 }}>
        {[
          { label: 'Total', value: pupils.length, color: theme.text },
          { label: 'Present', value: presentCount, color: theme.green },
          { label: 'Absent', value: absentCount, color: theme.red },
        ].map((item, i) => (
          <View key={item.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: theme.border }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: item.color }}>{item.value}</Text>
            <Text style={{ fontSize: 11.5, color: theme.muted, marginTop: 1 }}>{item.label}</Text>
          </View>
        ))}
      </Card>

      <SectionLabel>
        {className ? `${className} · ` : ''}Today's register
      </SectionLabel>

      {/* Pupil rows */}
      <Card pad={4} style={{ marginBottom: 18 }}>
        {pupils.map((pupil: RosterPupil, idx: number) => {
          const selected = register[pupil.id] ?? 'PRESENT';
          return (
            <View
              key={pupil.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: theme.border2,
              }}
            >
              {/* Name + admission number */}
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

              {/* P / A / L / E toggle buttons */}
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {STATUS_LABELS.map(({ key, short }) => {
                  const isSelected = selected === key;
                  const toneMap: Record<AttStatus, { fg: string; bg: string }> = {
                    PRESENT: { fg: '#fff', bg: theme.green },
                    ABSENT: { fg: '#fff', bg: theme.red },
                    LATE: { fg: '#fff', bg: theme.amber },
                    EXCUSED: { fg: theme.text, bg: theme.border },
                  };
                  const tone = toneMap[key];
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setStatus(pupil.id, key)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? tone.bg : theme.border2,
                        borderWidth: 1,
                        borderColor: isSelected ? tone.bg : theme.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: '800',
                          color: isSelected ? tone.fg : theme.muted2,
                        }}
                      >
                        {short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </Card>

      {/* Save button */}
      <Pressable
        onPress={() => { void handleSave(); }}
        disabled={bulkAttendance.isPending}
        style={{
          backgroundColor: bulkAttendance.isPending ? theme.muted2 : theme.primary,
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
        <Icon name="check" size={20} stroke={2.6} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15.5 }}>
          {bulkAttendance.isPending ? 'Saving…' : 'Save register'}
        </Text>
      </Pressable>

      {bulkAttendance.isError ? (
        <Text style={{ color: theme.red, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
          Failed to save. Please try again.
        </Text>
      ) : null}
    </View>
  );
}
