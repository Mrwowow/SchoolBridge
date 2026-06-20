// TODO: wire to GET /results via react-query
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from '@/components/ui';

// ── Mock data ──────────────────────────────────────────────────────────────

interface Result {
  id: string;
  pupilName: string;
  className: string;
  subject: string;
  term: string;
  score: number;
  total: number;
  grade: string;
  publishedAt: string;
}

const MOCK_RESULTS: Result[] = [
  { id: 'r1', pupilName: 'Temi Adeyemi',     className: 'Class 4A', subject: 'Mathematics', term: 'Term 2', score: 88, total: 100, grade: 'A',  publishedAt: '2025-06-15' },
  { id: 'r2', pupilName: 'Temi Adeyemi',     className: 'Class 4A', subject: 'English',     term: 'Term 2', score: 72, total: 100, grade: 'B',  publishedAt: '2025-06-15' },
  { id: 'r3', pupilName: 'Chukwu Obi',       className: 'Class 4A', subject: 'Mathematics', term: 'Term 2', score: 55, total: 100, grade: 'C',  publishedAt: '2025-06-15' },
  { id: 'r4', pupilName: 'Chukwu Obi',       className: 'Class 4A', subject: 'Science',     term: 'Term 2', score: 91, total: 100, grade: 'A+', publishedAt: '2025-06-15' },
  { id: 'r5', pupilName: 'Fatima Usman',     className: 'Class 3B', subject: 'Mathematics', term: 'Term 2', score: 45, total: 100, grade: 'D',  publishedAt: '2025-06-15' },
  { id: 'r6', pupilName: 'Emeka Nwosu',      className: 'Class 2B', subject: 'English',     term: 'Term 2', score: 78, total: 100, grade: 'B+', publishedAt: '2025-06-15' },
  { id: 'r7', pupilName: 'Damilola Afolabi', className: 'Class 3B', subject: 'Social Std.', term: 'Term 2', score: 82, total: 100, grade: 'A-', publishedAt: '2025-06-15' },
];

function gradeVariant(grade: string) {
  if (grade.startsWith('A')) return 'green' as const;
  if (grade.startsWith('B')) return 'blue' as const;
  if (grade.startsWith('C')) return 'yellow' as const;
  return 'red' as const;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_RESULTS.filter(
    (r) =>
      r.pupilName.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase()) ||
      r.className.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <p className="mt-1 text-sm text-gray-500">
          Term results published to parents
        </p>
      </div>

      <Card noPadding>
        <div className="border-b border-gray-100 px-5 py-4">
          <Input
            placeholder="Search by pupil, subject, or class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            aria-label="Search results"
          />
        </div>

        <CardHeader className="px-6 pt-4">
          <CardTitle>Published Results</CardTitle>
        </CardHeader>

        <Table aria-label="Results table">
          <TableHead>
            <TableRow>
              <Th>Pupil</Th>
              <Th>Class</Th>
              <Th>Subject</Th>
              <Th>Term</Th>
              <Th>Score</Th>
              <Th>Grade</Th>
              <Th>Published</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <Td colSpan={7} className="py-10 text-center text-gray-400">
                  No results match your search.
                </Td>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <Td className="font-medium text-gray-900">{r.pupilName}</Td>
                  <Td>{r.className}</Td>
                  <Td>{r.subject}</Td>
                  <Td className="text-gray-500">{r.term}</Td>
                  <Td>
                    <span className="font-mono text-sm">{r.score}/{r.total}</span>
                  </Td>
                  <Td>
                    <Badge variant={gradeVariant(r.grade)}>{r.grade}</Badge>
                  </Td>
                  <Td className="text-xs text-gray-400">
                    {new Date(r.publishedAt).toLocaleDateString('en-NG')}
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
