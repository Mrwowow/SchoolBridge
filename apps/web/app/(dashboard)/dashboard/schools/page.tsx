'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Plus, X, Search, Pause, Play, CreditCard } from 'lucide-react';
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
import { useSession } from '@/lib/session';
import {
  useAllSchools,
  useCreateSchool,
  useUpdateSchoolById,
  useUpsertSubscription,
  type SchoolListRow,
} from '@/lib/queries';
import { ApiError } from '@/lib/api';

const PLANS = ['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'] as const;

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: 'green',
  SUSPENDED: 'red',
  CHURNED: 'gray',
};

const PLAN_VARIANT: Record<string, BadgeVariant> = {
  TRIAL: 'gray',
  BASIC: 'blue',
  STANDARD: 'purple',
  PREMIUM: 'green',
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SchoolsPage() {
  const { isSuperAdmin } = useSession();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [billingFor, setBillingFor] = useState<SchoolListRow | null>(null);
  const { data, isLoading, isError, error } = useAllSchools();
  const updateSchool = useUpdateSchoolById();
  const [rowError, setRowError] = useState<string | null>(null);

  const schools = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () =>
      schools.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.slug.toLowerCase().includes(search.toLowerCase()),
      ),
    [schools, search],
  );

  if (!isSuperAdmin) {
    return (
      <p className="py-16 text-center text-sm text-gray-400">
        This area is for platform super admins only.
      </p>
    );
  }

  async function toggleStatus(school: SchoolListRow) {
    setRowError(null);
    const next = school.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateSchool.mutateAsync({ id: school.id, status: next });
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Could not update school.');
    }
  }

  async function changePlan(school: SchoolListRow, plan: string) {
    setRowError(null);
    try {
      await updateSchool.mutateAsync({ id: school.id, plan });
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Could not update plan.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${schools.length} schools on the platform`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} aria-hidden />
          Onboard School
        </Button>
      </div>

      {rowError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {rowError}
        </div>
      )}

      <Card noPadding>
        <div className="border-b border-gray-100 px-5 py-4">
          <Input
            placeholder="Search by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
            aria-label="Search schools"
          />
        </div>

        <Table aria-label="Schools table">
          <TableHead>
            <TableRow>
              <Th>School</Th>
              <Th>Pupils</Th>
              <Th>Members</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th> </Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isError ? (
              <TableRow>
                <Td colSpan={6} className="py-10 text-center text-red-500">
                  {error instanceof ApiError ? error.message : 'Failed to load schools.'}
                </Td>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <Td colSpan={6} className="py-10 text-center text-gray-400">
                  Loading schools…
                </Td>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <Td colSpan={6} className="py-10 text-center text-gray-400">
                  No schools found.
                </Td>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <Td>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="font-mono text-xs text-gray-400">{s.slug}</p>
                  </Td>
                  <Td>{s._count.pupils}</Td>
                  <Td>{s._count.memberships}</Td>
                  <Td>
                    <select
                      value={s.plan}
                      onChange={(e) => changePlan(s, e.target.value)}
                      disabled={updateSchool.isPending}
                      aria-label={`Plan for ${s.name}`}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-brand-400"
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[s.status] ?? 'gray'} dot>
                      {s.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setBillingFor(s)}>
                        <CreditCard size={13} aria-hidden /> Billing
                      </Button>
                      {s.status !== 'CHURNED' && (
                        <Button
                          size="sm"
                          variant={s.status === 'ACTIVE' ? 'outline' : 'secondary'}
                          onClick={() => toggleStatus(s)}
                          loading={updateSchool.isPending && updateSchool.variables?.id === s.id}
                        >
                          {s.status === 'ACTIVE' ? (
                            <>
                              <Pause size={13} aria-hidden /> Suspend
                            </>
                          ) : (
                            <>
                              <Play size={13} aria-hidden /> Activate
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {showAdd && <OnboardSchoolModal onClose={() => setShowAdd(false)} />}
      {billingFor && (
        <SubscriptionModal school={billingFor} onClose={() => setBillingFor(null)} />
      )}
    </div>
  );
}

function SubscriptionModal({
  school,
  onClose,
}: {
  school: SchoolListRow;
  onClose: () => void;
}) {
  const upsert = useUpsertSubscription();
  const today = new Date().toISOString().slice(0, 10);
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  const [plan, setPlan] = useState<string>(school.plan);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(oneYear.toISOString().slice(0, 10));
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (new Date(end) <= new Date(start)) {
      setFormError('End date must be after the start date.');
      return;
    }
    try {
      await upsert.mutateAsync({
        schoolId: school.id,
        plan,
        currentPeriodStart: new Date(start).toISOString(),
        currentPeriodEnd: new Date(end).toISOString(),
      });
      setDone(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not update subscription.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Subscription</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">{school.name}</p>

        {done ? (
          <p className="py-6 text-center text-sm font-medium text-emerald-600">
            Subscription saved — school plan updated.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Period start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              <Input label="Period end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={upsert.isPending}>
                Save subscription
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function OnboardSchoolModal({ onClose }: { onClose: () => void }) {
  const createSchool = useCreateSchool();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [plan, setPlan] = useState<string>('TRIAL');
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (name.trim().length < 2) return setFormError('Enter a school name (min 2 characters).');
    if (!/^[a-z0-9-]{2,}$/.test(effectiveSlug)) {
      return setFormError('Slug must be lowercase letters, numbers and hyphens (min 2).');
    }
    try {
      await createSchool.mutateAsync({ name: name.trim(), slug: effectiveSlug, plan });
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create school.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Onboard a school</h2>
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
            label="School name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Greenfield Academy"
            required
          />
          <Input
            label="Slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="greenfield-academy"
            hint="Used in URLs. Lowercase letters, numbers, hyphens."
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createSchool.isPending}>
              Create school
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
