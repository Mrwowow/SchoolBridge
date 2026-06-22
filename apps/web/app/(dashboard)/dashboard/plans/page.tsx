'use client';

import { useState, type FormEvent } from 'react';
import { X, Pencil, Users, UserCog, MessageSquare } from 'lucide-react';
import { Card, Badge, Button, Input } from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import { useSession } from '@/lib/session';
import { usePlans, useUpdatePlan, type PlanRow, type UpdatePlanBody } from '@/lib/queries';
import { ApiError } from '@/lib/api';

const PLAN_VARIANT: Record<string, BadgeVariant> = {
  TRIAL: 'gray',
  BASIC: 'blue',
  STANDARD: 'purple',
  PREMIUM: 'green',
};

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

function limit(value: number | null) {
  return value === null ? 'Unlimited' : value.toLocaleString('en-NG');
}

export default function PlansPage() {
  const { isSuperAdmin } = useSession();
  const { data, isLoading, isError } = usePlans();
  const [editing, setEditing] = useState<PlanRow | null>(null);

  if (!isSuperAdmin) {
    return (
      <p className="py-16 text-center text-sm text-gray-400">
        This area is for platform super admins only.
      </p>
    );
  }

  const plans = data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define what each plan tier costs and offers. Schools are assigned a tier from the
          Schools page.
        </p>
      </div>

      {isError ? (
        <Card>
          <p className="py-6 text-center text-sm text-red-500">Failed to load plans.</p>
        </Card>
      ) : isLoading ? (
        <Card>
          <p className="py-6 text-center text-sm text-gray-400">Loading plans…</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.tier} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">{plan.name}</h2>
                    <Badge variant={PLAN_VARIANT[plan.tier] ?? 'gray'}>{plan.tier}</Badge>
                    {!plan.isActive && <Badge variant="gray">Hidden</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{plan.description || '—'}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditing(plan)}>
                  <Pencil size={13} aria-hidden /> Edit
                </Button>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">
                  {plan.priceNaira === 0 ? 'Free' : naira.format(plan.priceNaira)}
                </span>
                {plan.priceNaira > 0 && (
                  <span className="text-sm text-gray-400">
                    /{plan.billingInterval === 'YEARLY' ? 'year' : 'month'}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-3 text-sm">
                <Metric icon={Users} label="Pupils" value={limit(plan.maxPupils)} />
                <Metric icon={UserCog} label="Staff" value={limit(plan.maxStaff)} />
                <Metric icon={MessageSquare} label="SMS" value={limit(plan.smsQuota)} />
              </dl>
            </Card>
          ))}
        </div>
      )}

      {editing && <EditPlanModal plan={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1 text-xs text-gray-400">
        <Icon size={13} aria-hidden /> {label}
      </dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

/** Empty string in a number field → null (unlimited). */
function toNullableInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function EditPlanModal({ plan, onClose }: { plan: PlanRow; onClose: () => void }) {
  const update = useUpdatePlan();
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description);
  const [price, setPrice] = useState(String(plan.priceNaira));
  const [interval, setInterval] = useState(plan.billingInterval);
  const [maxPupils, setMaxPupils] = useState(plan.maxPupils === null ? '' : String(plan.maxPupils));
  const [maxStaff, setMaxStaff] = useState(plan.maxStaff === null ? '' : String(plan.maxStaff));
  const [smsQuota, setSmsQuota] = useState(plan.smsQuota === null ? '' : String(plan.smsQuota));
  const [isActive, setIsActive] = useState(plan.isActive);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const priceNaira = Number(price);
    if (!Number.isFinite(priceNaira) || priceNaira < 0) {
      setFormError('Enter a valid price (0 or more).');
      return;
    }
    if (name.trim().length < 2) {
      setFormError('Plan name must be at least 2 characters.');
      return;
    }

    const body: UpdatePlanBody = {
      name: name.trim(),
      description: description.trim(),
      priceNaira: Math.trunc(priceNaira),
      billingInterval: interval,
      maxPupils: toNullableInt(maxPupils),
      maxStaff: toNullableInt(maxStaff),
      smsQuota: toNullableInt(smsQuota),
      isActive,
    };

    try {
      await update.mutateAsync({ tier: plan.tier, body });
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save the plan.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit plan</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">{plan.tier} tier</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {formError}
            </div>
          )}

          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary shown to schools"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₦)"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Billing</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as 'MONTHLY' | 'YEARLY')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Max pupils"
              type="number"
              min={1}
              value={maxPupils}
              onChange={(e) => setMaxPupils(e.target.value)}
              hint="Blank = ∞"
            />
            <Input
              label="Max staff"
              type="number"
              min={1}
              value={maxStaff}
              onChange={(e) => setMaxStaff(e.target.value)}
              hint="Blank = ∞"
            />
            <Input
              label="SMS quota"
              type="number"
              min={0}
              value={smsQuota}
              onChange={(e) => setSmsQuota(e.target.value)}
              hint="Blank = ∞"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
            />
            Active (offered to new sign-ups)
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Save plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
