'use client';

import { Users, School, CalendarDays, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { usePupils, useClasses, useCurrentTerm } from '@/lib/queries';

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

export default function DashboardPage() {
  const pupils = usePupils();
  const classes = useClasses();
  const { term } = useCurrentTerm();

  const pupilCount = pupils.data?.items.length;
  const classList = classes.data ?? [];
  const enrolled = classList.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          {term ? `Current term: ${term.label}` : 'No current term set'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Pupils"
          value={pupils.isLoading ? '…' : String(pupilCount ?? 0)}
          hint="Across the school roster"
          icon={Users}
          color="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="Classes"
          value={classes.isLoading ? '…' : String(classList.length)}
          hint={`${enrolled} active enrollments`}
          icon={School}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Current Term"
          value={term?.label ?? '—'}
          hint={term ? 'Active session' : 'Set one in Academic setup'}
          icon={CalendarDays}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Avg. Class Size"
          value={
            classList.length > 0 ? String(Math.round(enrolled / classList.length)) : '0'
          }
          hint="Enrolled pupils per class"
          icon={BookOpen}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <Card noPadding>
        <CardHeader className="px-6 pt-6">
          <CardTitle>Classes</CardTitle>
          <Badge variant="gray">{classList.length} total</Badge>
        </CardHeader>

        <div className="divide-y divide-gray-50">
          {classes.isLoading ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Loading…</p>
          ) : classList.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">
              No classes yet — create one under Classes.
            </p>
          ) : (
            classList.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-3.5">
                <p className="text-sm font-medium text-gray-900">{c.name}</p>
                <Badge variant="blue">{c._count?.enrollments ?? 0} pupils</Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
