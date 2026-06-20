// TODO: wire to GET /attendance and POST /attendance via react-query
'use client';

import { useState } from 'react';
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

// ── Mock data ──────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  pupilName: string;
  className: string;
  date: string;
  status: AttendanceStatus;
  parentNotified: boolean;
}

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', pupilName: 'Temi Adeyemi',     className: 'Class 4A', date: '2025-06-20', status: 'PRESENT', parentNotified: false },
  { id: 'a2', pupilName: 'Chukwu Obi',       className: 'Class 4A', date: '2025-06-20', status: 'ABSENT',  parentNotified: true },
  { id: 'a3', pupilName: 'Fatima Usman',     className: 'Class 3B', date: '2025-06-20', status: 'LATE',    parentNotified: true },
  { id: 'a4', pupilName: 'Emeka Nwosu',      className: 'Class 2B', date: '2025-06-20', status: 'PRESENT', parentNotified: false },
  { id: 'a5', pupilName: 'Amaka Okafor',     className: 'Class 1C', date: '2025-06-20', status: 'EXCUSED', parentNotified: true },
  { id: 'a6', pupilName: 'Bello Musa',       className: 'Class 5A', date: '2025-06-20', status: 'PRESENT', parentNotified: false },
  { id: 'a7', pupilName: 'Chisom Eze',       className: 'Class 5A', date: '2025-06-20', status: 'ABSENT',  parentNotified: true },
  { id: 'a8', pupilName: 'Damilola Afolabi', className: 'Class 3B', date: '2025-06-20', status: 'PRESENT', parentNotified: false },
];

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; variant: BadgeVariant; icon: React.ElementType }> = {
  PRESENT: { label: 'Present', variant: 'green',  icon: CheckCircle },
  ABSENT:  { label: 'Absent',  variant: 'red',    icon: XCircle },
  LATE:    { label: 'Late',    variant: 'yellow', icon: Clock },
  EXCUSED: { label: 'Excused', variant: 'gray',   icon: AlertCircle },
};

// ── Summary Stat ───────────────────────────────────────────────────────────

function Stat({ label, count, variant }: { label: string; count: number; variant: BadgeVariant }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-white p-4 text-center shadow-card">
      <span className="text-2xl font-bold text-gray-900">{count}</span>
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [date, setDate] = useState('2025-06-20');

  const present = MOCK_ATTENDANCE.filter((r) => r.status === 'PRESENT').length;
  const absent  = MOCK_ATTENDANCE.filter((r) => r.status === 'ABSENT').length;
  const late    = MOCK_ATTENDANCE.filter((r) => r.status === 'LATE').length;
  const excused = MOCK_ATTENDANCE.filter((r) => r.status === 'EXCUSED').length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daily register across all classes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Select date"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <Button size="sm" variant="secondary">
            {/* TODO: mark attendance for selected date */}
            Mark Today
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Present" count={present} variant="green" />
        <Stat label="Absent"  count={absent}  variant="red" />
        <Stat label="Late"    count={late}    variant="yellow" />
        <Stat label="Excused" count={excused} variant="gray" />
      </div>

      {/* Register table */}
      <Card noPadding>
        <CardHeader className="px-6 pt-6">
          <CardTitle>Register — {new Date(date).toLocaleDateString('en-NG', { dateStyle: 'long' })}</CardTitle>
        </CardHeader>
        <Table aria-label="Attendance register">
          <TableHead>
            <TableRow>
              <Th>Pupil</Th>
              <Th>Class</Th>
              <Th>Status</Th>
              <Th>Parent notified</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_ATTENDANCE.map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              const Icon = cfg.icon;
              return (
                <TableRow key={r.id}>
                  <Td className="font-medium text-gray-900">{r.pupilName}</Td>
                  <Td>{r.className}</Td>
                  <Td>
                    <Badge variant={cfg.variant} dot>
                      <Icon size={12} aria-hidden />
                      {cfg.label}
                    </Badge>
                  </Td>
                  <Td>
                    {r.status === 'PRESENT' ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : r.parentNotified ? (
                      <Badge variant="green" dot>SMS sent</Badge>
                    ) : (
                      <Badge variant="red">Not sent</Badge>
                    )}
                  </Td>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
