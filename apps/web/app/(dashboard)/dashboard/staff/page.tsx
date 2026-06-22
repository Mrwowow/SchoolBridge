'use client';

import { useState, type FormEvent } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
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
import type { BadgeVariant } from '@/components/ui';
import {
  useMembers,
  useAddMember,
  useRemoveMember,
  useLookupUser,
  type MemberRow,
  type UserLookup,
} from '@/lib/queries';
import { ApiError } from '@/lib/api';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'Administrator',
  CLASS_TEACHER: 'Class Teacher',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
};

const ROLE_VARIANT: Record<string, BadgeVariant> = {
  SUPER_ADMIN: 'purple',
  SCHOOL_ADMIN: 'blue',
  CLASS_TEACHER: 'green',
  TEACHER: 'green',
  PARENT: 'gray',
};

const ASSIGNABLE_ROLES = ['SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT'] as const;

export default function StaffPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading, isError, error } = useMembers();
  const removeMember = useRemoveMember();
  const [actionError, setActionError] = useState<string | null>(null);

  // Staff = everyone who isn't a plain parent.
  const members = (data ?? []).filter((m) => m.role !== 'PARENT');

  async function handleRemove(member: MemberRow) {
    setActionError(null);
    if (!confirm(`Remove ${member.user.fullName} (${ROLE_LABELS[member.role] ?? member.role})?`)) {
      return;
    }
    try {
      await removeMember.mutateAsync({ userId: member.userId, role: member.role });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not remove member.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${members.length} staff members`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} aria-hidden />
          Add Member
        </Button>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <Card noPadding>
        <Table aria-label="Staff table">
          <TableHead>
            <TableRow>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Role</Th>
              <Th> </Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isError ? (
              <TableRow>
                <Td colSpan={4} className="py-10 text-center text-red-500">
                  {error instanceof ApiError ? error.message : 'Failed to load staff.'}
                </Td>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <Td colSpan={4} className="py-10 text-center text-gray-400">
                  Loading staff…
                </Td>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <Td colSpan={4} className="py-10 text-center text-gray-400">
                  No staff members yet.
                </Td>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <Td className="font-medium text-gray-900">{m.user.fullName}</Td>
                  <Td className="font-mono text-xs">{m.user.phone}</Td>
                  <Td>
                    <Badge variant={ROLE_VARIANT[m.role] ?? 'gray'}>
                      {ROLE_LABELS[m.role] ?? m.role}
                    </Badge>
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => handleRemove(m)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${m.user.fullName}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const lookup = useLookupUser();
  const addMember = useAddMember();

  const [phone, setPhone] = useState('');
  const [found, setFound] = useState<UserLookup | null>(null);
  const [role, setRole] = useState<string>('TEACHER');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFound(null);
    const trimmed = phone.trim();
    if (!/^(\+234|0)\d{10}$/.test(trimmed)) {
      setFormError('Enter a valid Nigerian phone number (0… or +234…).');
      return;
    }
    try {
      const user = await lookup.mutateAsync(trimmed);
      setFound(user);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Lookup failed.');
    }
  }

  async function handleAdd() {
    if (!found) return;
    setFormError(null);
    try {
      await addMember.mutateAsync({ userId: found.id, role });
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not add member.');
    }
  }

  const alreadyHasRole = found?.existingRoles.includes(role) ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add staff member</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleLookup} className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Phone number"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFound(null);
                }}
                placeholder="08012345678"
                hint="The person must already have a SchoolBridge account."
                required
              />
            </div>
            <Button type="submit" variant="secondary" loading={lookup.isPending}>
              Find
            </Button>
          </div>
        </form>

        {found && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{found.fullName}</p>
              <p className="font-mono text-xs text-gray-500">{found.phone}</p>
              {found.alreadyMember && (
                <p className="mt-1.5 text-xs text-amber-600">
                  Already a member as: {found.existingRoles.join(', ')}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              {alreadyHasRole && (
                <p className="text-xs text-amber-600">This person already holds that role.</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAdd} loading={addMember.isPending} disabled={alreadyHasRole}>
                Add member
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
