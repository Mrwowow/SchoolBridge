'use client';

import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
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
import { useClasses, useCreateClass } from '@/lib/queries';
import { ApiError } from '@/lib/api';

export default function ClassesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading, isError, error } = useClasses();
  const classes = data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${classes.length} classes`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} aria-hidden />
          Add Class
        </Button>
      </div>

      <Card noPadding>
        <Table aria-label="Classes table">
          <TableHead>
            <TableRow>
              <Th>Class</Th>
              <Th>Enrolled pupils</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isError ? (
              <TableRow>
                <Td colSpan={2} className="py-10 text-center text-red-500">
                  {error instanceof ApiError ? error.message : 'Failed to load classes.'}
                </Td>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <Td colSpan={2} className="py-10 text-center text-gray-400">
                  Loading classes…
                </Td>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <Td colSpan={2} className="py-10 text-center text-gray-400">
                  No classes yet. Add your first class to start enrolling pupils.
                </Td>
              </TableRow>
            ) : (
              classes.map((c) => (
                <TableRow key={c.id}>
                  <Td className="font-medium text-gray-900">{c.name}</Td>
                  <Td>
                    <Badge variant="blue">{c._count?.enrollments ?? 0}</Badge>
                  </Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {showAdd && <AddClassModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddClassModal({ onClose }: { onClose: () => void }) {
  const createClass = useCreateClass();
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (name.trim().length < 1) {
      setFormError('Class name is required.');
      return;
    }
    try {
      await createClass.mutateAsync({ name: name.trim() });
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not add class.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add class</h2>
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
            label="Class name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. JSS 1A"
            required
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createClass.isPending}>
              Add class
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
