'use client';

import { useMemo, useState } from 'react';
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
import { useResults, useCurrentTerm } from '@/lib/queries';
import { ApiError } from '@/lib/api';

function gradeVariant(grade: string | null) {
  if (!grade) return 'gray' as const;
  if (grade.startsWith('A')) return 'green' as const;
  if (grade.startsWith('B')) return 'blue' as const;
  if (grade.startsWith('C')) return 'yellow' as const;
  return 'red' as const;
}

export default function ResultsPage() {
  const [search, setSearch] = useState('');
  const { term } = useCurrentTerm();
  const { data, isLoading, isError, error } = useResults({ termId: term?.id });
  const results = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(
    () =>
      results.filter(
        (r) =>
          r.pupil.fullName.toLowerCase().includes(search.toLowerCase()) ||
          r.subject.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [results, search],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <p className="mt-1 text-sm text-gray-500">
          {term ? `${term.label} assessment results` : 'Assessment results'}
        </p>
      </div>

      <Card noPadding>
        <div className="border-b border-gray-100 px-5 py-4">
          <Input
            placeholder="Search by pupil or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            aria-label="Search results"
          />
        </div>

        <CardHeader className="px-6 pt-4">
          <CardTitle>Results</CardTitle>
        </CardHeader>

        <Table aria-label="Results table">
          <TableHead>
            <TableRow>
              <Th>Pupil</Th>
              <Th>Subject</Th>
              <Th>Score</Th>
              <Th>Grade</Th>
              <Th>Remark</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isError ? (
              <TableRow>
                <Td colSpan={5} className="py-10 text-center text-red-500">
                  {error instanceof ApiError ? error.message : 'Failed to load results.'}
                </Td>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <Td colSpan={5} className="py-10 text-center text-gray-400">
                  Loading results…
                </Td>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <Td colSpan={5} className="py-10 text-center text-gray-400">
                  No results recorded yet.
                </Td>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <Td className="font-medium text-gray-900">{r.pupil.fullName}</Td>
                  <Td>{r.subject.name}</Td>
                  <Td>
                    <span className="font-mono text-sm">
                      {Number(r.score)}/{Number(r.maxScore)}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={gradeVariant(r.grade)}>{r.grade ?? '—'}</Badge>
                  </Td>
                  <Td className="text-xs text-gray-500">{r.remarks ?? '—'}</Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
