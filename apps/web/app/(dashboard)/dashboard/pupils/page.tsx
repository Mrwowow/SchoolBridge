'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Search, Plus, X } from 'lucide-react';
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
import { usePupils, useClasses, useCreatePupil } from '@/lib/queries';
import { ApiError } from '@/lib/api';

export default function PupilsPage() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const classes = useClasses();
  const { data, isLoading, isError, error } = usePupils(classFilter || undefined);
  const pupils = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(
    () =>
      pupils.filter(
        (p) =>
          p.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (p.admissionNo ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
    [pupils, search],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pupils</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${pupils.length} pupils`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} aria-hidden />
          Add Pupil
        </Button>
      </div>

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row">
          <Input
            placeholder="Search by name or admission no.…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            aria-label="Search pupils"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            aria-label="Filter by class"
          >
            <option value="">All classes</option>
            {(classes.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Table aria-label="Pupils table">
          <TableHead>
            <TableRow>
              <Th>Adm. No.</Th>
              <Th>Full Name</Th>
              <Th>Gender</Th>
              <Th>Date of Birth</Th>
              <Th>Added</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isError ? (
              <TableRow>
                <Td colSpan={5} className="py-10 text-center text-red-500">
                  {error instanceof ApiError ? error.message : 'Failed to load pupils.'}
                </Td>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <Td colSpan={5} className="py-10 text-center text-gray-400">
                  Loading pupils…
                </Td>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <Td colSpan={5} className="py-10 text-center text-gray-400">
                  No pupils found.
                </Td>
              </TableRow>
            ) : (
              filtered.map((pupil) => (
                <TableRow key={pupil.id}>
                  <Td className="font-mono text-xs text-gray-400">{pupil.admissionNo ?? '—'}</Td>
                  <Td className="font-medium text-gray-900">{pupil.fullName}</Td>
                  <Td>
                    {pupil.gender ? (
                      <Badge variant="gray">{pupil.gender}</Badge>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </Td>
                  <Td>
                    {pupil.dateOfBirth ? new Date(pupil.dateOfBirth).toLocaleDateString() : '—'}
                  </Td>
                  <Td className="text-xs text-gray-400">
                    {new Date(pupil.createdAt).toLocaleDateString()}
                  </Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {showAdd && <AddPupilModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddPupilModal({ onClose }: { onClose: () => void }) {
  const createPupil = useCreatePupil();
  const [fullName, setFullName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (fullName.trim().length < 2) {
      setFormError('Full name is required.');
      return;
    }
    try {
      await createPupil.mutateAsync({
        fullName: fullName.trim(),
        admissionNo: admissionNo.trim() || undefined,
        gender: (gender || undefined) as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
        dateOfBirth: dateOfBirth || undefined,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not add pupil.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add pupil</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Temi Adeyemi"
            required
          />
          <Input
            label="Admission no. (optional)"
            value={admissionNo}
            onChange={(e) => setAdmissionNo(e.target.value)}
            placeholder="e.g. ADM/001"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Gender (optional)</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <Input
            label="Date of birth (optional)"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createPupil.isPending}>
              Add pupil
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
