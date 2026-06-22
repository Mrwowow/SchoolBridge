'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import type { AttendanceStatus } from '@schoolbridge/types';
import {
  useClasses,
  usePupils,
  useAttendance,
  useRecordAttendance,
  useCurrentTerm,
} from '@/lib/queries';
import { ApiError } from '@/lib/api';

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; variant: BadgeVariant; icon: React.ElementType }
> = {
  PRESENT: { label: 'Present', variant: 'green', icon: CheckCircle },
  ABSENT: { label: 'Absent', variant: 'red', icon: XCircle },
  LATE: { label: 'Late', variant: 'yellow', icon: Clock },
  EXCUSED: { label: 'Excused', variant: 'gray', icon: AlertCircle },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Stat({ label, count, variant }: { label: string; count: number; variant: BadgeVariant }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-white p-4 text-center shadow-card">
      <span className="text-2xl font-bold text-gray-900">{count}</span>
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}

export default function AttendancePage() {
  const [date, setDate] = useState(todayISO());
  const [classId, setClassId] = useState('');
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const classes = useClasses();
  const pupils = usePupils(classId || undefined);
  const { term } = useCurrentTerm();
  const existing = useAttendance({ classId: classId || undefined, from: date, to: date });
  const record = useRecordAttendance();

  // Seed marks from existing records (or default PRESENT) when class/date/pupils change.
  useEffect(() => {
    const roster = pupils.data?.items ?? [];
    if (roster.length === 0) return;
    const byPupil = new Map((existing.data ?? []).map((r) => [r.pupilId, r.status]));
    setMarks(
      Object.fromEntries(roster.map((p) => [p.id, byPupil.get(p.id) ?? ('PRESENT' as AttendanceStatus)])),
    );
  }, [pupils.data, existing.data, classId, date]);

  const roster = useMemo(() => pupils.data?.items ?? [], [pupils.data]);
  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const p of roster) c[marks[p.id] ?? 'PRESENT']++;
    return c;
  }, [roster, marks]);

  async function handleSave() {
    setSaveError(null);
    if (!classId) return setSaveError('Select a class first.');
    if (!term) return setSaveError('No current term is set. Create one under Settings/Academic.');
    if (roster.length === 0) return setSaveError('No pupils enrolled in this class.');
    try {
      await record.mutateAsync({
        termId: term.id,
        classRoomId: classId,
        date,
        entries: roster.map((p) => ({ pupilId: p.id, status: marks[p.id] ?? 'PRESENT' })),
      });
      await existing.refetch();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save the register.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">Daily class register</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            aria-label="Select class"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Select class…</option>
            {(classes.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Select date"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <Button size="sm" onClick={handleSave} loading={record.isPending} disabled={!classId}>
            Save register
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {saveError}
        </div>
      )}
      {record.isSuccess && !saveError && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Register saved — guardians of absent/late pupils are notified.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Present" count={counts.PRESENT} variant="green" />
        <Stat label="Absent" count={counts.ABSENT} variant="red" />
        <Stat label="Late" count={counts.LATE} variant="yellow" />
        <Stat label="Excused" count={counts.EXCUSED} variant="gray" />
      </div>

      <Card noPadding>
        <CardHeader className="px-6 pt-6">
          <CardTitle>
            Register — {new Date(date).toLocaleDateString('en-NG', { dateStyle: 'long' })}
          </CardTitle>
        </CardHeader>
        <Table aria-label="Attendance register">
          <TableHead>
            <TableRow>
              <Th>Pupil</Th>
              <Th>Status</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {!classId ? (
              <TableRow>
                <Td colSpan={2} className="py-10 text-center text-gray-400">
                  Select a class to take the register.
                </Td>
              </TableRow>
            ) : pupils.isLoading ? (
              <TableRow>
                <Td colSpan={2} className="py-10 text-center text-gray-400">
                  Loading pupils…
                </Td>
              </TableRow>
            ) : roster.length === 0 ? (
              <TableRow>
                <Td colSpan={2} className="py-10 text-center text-gray-400">
                  No pupils enrolled in this class.
                </Td>
              </TableRow>
            ) : (
              roster.map((p) => (
                <TableRow key={p.id}>
                  <Td className="font-medium text-gray-900">{p.fullName}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((s) => {
                        const active = (marks[p.id] ?? 'PRESENT') === s;
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setMarks((m) => ({ ...m, [p.id]: s }))}
                            className={
                              active
                                ? 'rounded-lg border border-brand-400 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700'
                                : 'rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50'
                            }
                            aria-pressed={active}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
