// TODO: wire stats + activity to GET /dashboard/overview (API not yet implemented)
import {
  Users,
  MessageSquare,
  CheckSquare,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';

// ── Mock data ──────────────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Total Pupils',
    value: '342',
    change: '+12 this term',
    trend: 'up' as const,
    icon: Users,
    color: 'bg-brand-50 text-brand-600',
  },
  {
    label: 'Messages Sent',
    value: '1,204',
    change: '+89 this week',
    trend: 'up' as const,
    icon: MessageSquare,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    label: 'Acknowledgement Rate',
    value: '87%',
    change: '-2% vs last week',
    trend: 'down' as const,
    icon: CheckSquare,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Fees Outstanding',
    value: '₦2.4M',
    change: '28 pupils pending',
    trend: 'neutral' as const,
    icon: CreditCard,
    color: 'bg-amber-50 text-amber-600',
  },
];

type ActivityType = 'HOMEWORK' | 'NOTE' | 'FEE_REMINDER' | 'ATTENDANCE' | 'ANNOUNCEMENT';

const RECENT_ACTIVITY: {
  id: string;
  type: ActivityType;
  actor: string;
  target: string;
  summary: string;
  time: string;
}[] = [
  {
    id: '1',
    type: 'HOMEWORK',
    actor: 'Mrs Adebayo',
    target: 'Class 4A',
    summary: 'Assigned Maths homework — due Friday',
    time: '10 min ago',
  },
  {
    id: '2',
    type: 'NOTE',
    actor: 'Mr Okonkwo',
    target: 'Temi Adeyemi',
    summary: 'Excellent participation in Science class today!',
    time: '42 min ago',
  },
  {
    id: '3',
    type: 'FEE_REMINDER',
    actor: 'Admin',
    target: 'School',
    summary: 'Term 2 fees reminder broadcast sent to all parents',
    time: '2 h ago',
  },
  {
    id: '4',
    type: 'ATTENDANCE',
    actor: 'Mrs Nwosu',
    target: 'Class 2B',
    summary: '3 pupils marked absent — SMS sent to parents',
    time: '3 h ago',
  },
  {
    id: '5',
    type: 'ANNOUNCEMENT',
    actor: 'Principal',
    target: 'School',
    summary: 'PTA meeting scheduled for Saturday 12 July at 10am',
    time: '1 d ago',
  },
];

const TYPE_BADGE: Record<ActivityType, { label: string; variant: BadgeVariant }> = {
  HOMEWORK:     { label: 'Homework',    variant: 'blue' },
  NOTE:         { label: 'Note',        variant: 'green' },
  FEE_REMINDER: { label: 'Fee Reminder',variant: 'yellow' },
  ATTENDANCE:   { label: 'Attendance',  variant: 'purple' },
  ANNOUNCEMENT: { label: 'Broadcast',   variant: 'gray' },
};

// ── Components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: (typeof STATS)[number]) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={20} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        <div className="mt-1.5 flex items-center gap-1 text-xs">
          {trend === 'up' && <TrendingUp size={12} className="text-emerald-500" />}
          {trend === 'down' && <TrendingDown size={12} className="text-red-400" />}
          <span className={trend === 'down' ? 'text-red-400' : 'text-gray-400'}>
            {change}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          {/* TODO: replace with real school name from context */}
          Greenfield Academy &mdash; Term 2, 2025/2026
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent activity */}
      <Card noPadding>
        <CardHeader className="px-6 pt-6">
          <CardTitle>Recent Activity</CardTitle>
          <Badge variant="gray">{RECENT_ACTIVITY.length} items</Badge>
        </CardHeader>

        <div className="divide-y divide-gray-50">
          {RECENT_ACTIVITY.map((item) => {
            const badge = TYPE_BADGE[item.type];
            return (
              <div
                key={item.id}
                className="flex flex-col gap-1.5 px-6 py-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="w-32 shrink-0">
                  <Badge variant={badge.variant} dot>
                    {badge.label}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{item.summary}</p>
                  <p className="text-xs text-gray-400">
                    {item.actor} &rarr; {item.target}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                  {item.time}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-50 px-6 py-4">
          <p className="text-xs text-gray-400">
            {/* TODO: link to full activity log when available */}
            Showing last 5 activities
          </p>
        </div>
      </Card>
    </div>
  );
}
