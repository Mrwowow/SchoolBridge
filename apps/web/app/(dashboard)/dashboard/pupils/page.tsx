// TODO: replace mock data with GET /pupils?schoolId=... via react-query
'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  Input,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from '@/components/ui';

// ── Mock data ──────────────────────────────────────────────────────────────

interface Pupil {
  id: string;
  admissionNo: string;
  fullName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  status: 'Active' | 'Inactive';
}

const MOCK_PUPILS: Pupil[] = [
  { id: 'p1', admissionNo: 'ADM/001', fullName: 'Temi Adeyemi',     className: 'Class 4A', parentName: 'Mrs Adeyemi',  parentPhone: '08012345001', status: 'Active' },
  { id: 'p2', admissionNo: 'ADM/002', fullName: 'Chukwu Obi',       className: 'Class 4A', parentName: 'Mr Obi',       parentPhone: '08012345002', status: 'Active' },
  { id: 'p3', admissionNo: 'ADM/003', fullName: 'Fatima Usman',     className: 'Class 3B', parentName: 'Alhaji Usman', parentPhone: '08012345003', status: 'Active' },
  { id: 'p4', admissionNo: 'ADM/004', fullName: 'Emeka Nwosu',      className: 'Class 2B', parentName: 'Mrs Nwosu',    parentPhone: '08012345004', status: 'Active' },
  { id: 'p5', admissionNo: 'ADM/005', fullName: 'Amaka Okafor',     className: 'Class 1C', parentName: 'Mr Okafor',    parentPhone: '08012345005', status: 'Inactive' },
  { id: 'p6', admissionNo: 'ADM/006', fullName: 'Bello Musa',       className: 'Class 5A', parentName: 'Mrs Musa',     parentPhone: '08012345006', status: 'Active' },
  { id: 'p7', admissionNo: 'ADM/007', fullName: 'Chisom Eze',       className: 'Class 5A', parentName: 'Dr Eze',       parentPhone: '08012345007', status: 'Active' },
  { id: 'p8', admissionNo: 'ADM/008', fullName: 'Damilola Afolabi', className: 'Class 3B', parentName: 'Mrs Afolabi',  parentPhone: '08012345008', status: 'Active' },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function PupilsPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_PUPILS.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
      p.className.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pupils</h1>
          <p className="mt-1 text-sm text-gray-500">
            {MOCK_PUPILS.length} pupils enrolled
          </p>
        </div>
        <Button size="sm">
          <Plus size={16} aria-hidden />
          Add Pupil
        </Button>
      </div>

      <Card noPadding>
        {/* Search toolbar */}
        <div className="border-b border-gray-100 px-5 py-4">
          <Input
            placeholder="Search by name, admission no., or class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            aria-label="Search pupils"
          />
        </div>

        {/* Table */}
        <Table aria-label="Pupils table">
          <TableHead>
            <TableRow>
              <Th>Adm. No.</Th>
              <Th>Full Name</Th>
              <Th>Class</Th>
              <Th>Parent / Guardian</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <Td colSpan={6} className="py-10 text-center text-gray-400">
                  No pupils match your search.
                </Td>
              </TableRow>
            ) : (
              filtered.map((pupil) => (
                <TableRow key={pupil.id}>
                  <Td className="font-mono text-xs text-gray-400">{pupil.admissionNo}</Td>
                  <Td className="font-medium text-gray-900">{pupil.fullName}</Td>
                  <Td>{pupil.className}</Td>
                  <Td>{pupil.parentName}</Td>
                  <Td className="font-mono text-xs">{pupil.parentPhone}</Td>
                  <Td>
                    <Badge
                      variant={pupil.status === 'Active' ? 'green' : 'gray'}
                      dot
                    >
                      {pupil.status}
                    </Badge>
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
