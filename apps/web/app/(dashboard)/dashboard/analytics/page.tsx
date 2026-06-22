'use client';

import { CheckSquare, Eye, CalendarCheck, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import { useSchoolAnalytics } from '@/lib/queries';
import { useT } from '@/lib/i18n';

function RateCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
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
      </div>
    </Card>
  );
}

const ATTENDANCE_VARIANT: Record<string, BadgeVariant> = {
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'yellow',
  EXCUSED: 'gray',
};

export default function AnalyticsPage() {
  const t = useT();
  const { data, isLoading, isError } = useSchoolAnalytics();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('analytics.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">How parents engage with the school</p>
      </div>

      {isError ? (
        <Card>
          <p className="py-6 text-center text-sm text-red-500">Failed to load analytics.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <RateCard
              label={t('analytics.ackRate')}
              value={isLoading ? '…' : `${data?.messaging.ackRate ?? 0}%`}
              icon={CheckSquare}
              color="bg-emerald-50 text-emerald-600"
            />
            <RateCard
              label={t('analytics.readRate')}
              value={isLoading ? '…' : `${data?.messaging.readRate ?? 0}%`}
              icon={Eye}
              color="bg-brand-50 text-brand-600"
            />
            <RateCard
              label={t('analytics.presentRate')}
              value={isLoading ? '…' : `${data?.attendance.presentRate ?? 0}%`}
              icon={CalendarCheck}
              color="bg-violet-50 text-violet-600"
            />
            <RateCard
              label={t('analytics.linkedGuardians')}
              value={isLoading ? '…' : String(data?.roster.linkedGuardians ?? 0)}
              icon={Users}
              color="bg-amber-50 text-amber-600"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Attendance mix */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance breakdown</CardTitle>
                <Badge variant="gray">{data?.attendance.total ?? 0} records</Badge>
              </CardHeader>
              <div className="flex flex-col gap-3">
                {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((status) => {
                  const count = data?.attendance[status] ?? 0;
                  const total = data?.attendance.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <Badge variant={ATTENDANCE_VARIANT[status]}>{status}</Badge>
                        <span className="text-gray-400">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Messages by type */}
            <Card>
              <CardHeader>
                <CardTitle>Messages by type</CardTitle>
                <Badge variant="gray">{data?.messaging.total ?? 0} sent</Badge>
              </CardHeader>
              {isLoading ? (
                <p className="py-6 text-center text-sm text-gray-400">Loading…</p>
              ) : Object.keys(data?.messaging.byType ?? {}).length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No messages sent yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {Object.entries(data?.messaging.byType ?? {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-gray-700">{type.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
