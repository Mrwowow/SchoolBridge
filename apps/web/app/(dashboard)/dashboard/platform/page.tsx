'use client';

import { Building2, Users, GraduationCap, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import { useSession } from '@/lib/session';
import { usePlatformOverview } from '@/lib/queries';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: 'green',
  SUSPENDED: 'red',
  CHURNED: 'gray',
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={20} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
      </div>
    </Card>
  );
}

export default function PlatformPage() {
  const { isSuperAdmin } = useSession();
  const { data, isLoading, isError } = usePlatformOverview();

  if (!isSuperAdmin) {
    return (
      <p className="py-16 text-center text-sm text-gray-400">
        This area is for platform super admins only.
      </p>
    );
  }

  const t = data?.totals;
  const plans = data?.schoolsByPlan ?? {};

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Across all schools on SchoolBridge</p>
      </div>

      {isError ? (
        <Card>
          <p className="py-6 text-center text-sm text-red-500">Failed to load platform metrics.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Schools"
              value={isLoading ? '…' : String(t?.schools ?? 0)}
              hint={`${t?.activeSchools ?? 0} active · ${t?.suspendedSchools ?? 0} suspended`}
              icon={Building2}
              color="bg-brand-50 text-brand-600"
            />
            <StatCard
              label="Pupils"
              value={isLoading ? '…' : String(t?.pupils ?? 0)}
              hint="Across every tenant"
              icon={GraduationCap}
              color="bg-violet-50 text-violet-600"
            />
            <StatCard
              label="Users"
              value={isLoading ? '…' : String(t?.users ?? 0)}
              hint="Admins, teachers and parents"
              icon={Users}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Messages"
              value={isLoading ? '…' : String(t?.messages ?? 0)}
              hint="Booklet entries sent"
              icon={MessageSquare}
              color="bg-amber-50 text-amber-600"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Plan distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Schools by plan</CardTitle>
              </CardHeader>
              <div className="flex flex-col gap-3">
                {['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM'].map((plan) => {
                  const count = plans[plan] ?? 0;
                  const total = t?.schools || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={plan}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-700">{plan}</span>
                        <span className="text-gray-400">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent schools */}
            <Card noPadding>
              <CardHeader className="px-6 pt-6">
                <CardTitle>Recently onboarded</CardTitle>
              </CardHeader>
              <div className="divide-y divide-gray-50">
                {isLoading ? (
                  <p className="px-6 py-8 text-center text-sm text-gray-400">Loading…</p>
                ) : (data?.recentSchools.length ?? 0) === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-gray-400">No schools yet.</p>
                ) : (
                  data?.recentSchools.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-6 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">
                          {s._count.pupils} pupils · {new Date(s.createdAt).toLocaleDateString('en-NG')}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[s.status] ?? 'gray'}>{s.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
