'use client';

// TODO: wire to POST /messages and GET /messages via react-query

import { useState } from 'react';
import { Send, Plus, X, ChevronDown } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
} from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import { CreateMessageDto } from '@schoolbridge/types';
import type { MessageType, MessageTarget } from '@schoolbridge/types';
import { clsx } from 'clsx';

// ── Types ──────────────────────────────────────────────────────────────────

interface MessageListItem {
  id: string;
  type: MessageType;
  title: string;
  body?: string;
  target: MessageTarget;
  targetName: string;
  sentAt: string;
  ackRate: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_MESSAGES: MessageListItem[] = [
  { id: 'm1', type: 'HOMEWORK',     title: 'Maths Homework — Fractions',       body: 'Complete exercises 4.1–4.5 in the textbook.', target: 'CLASS',  targetName: 'Class 4A',       sentAt: '2025-06-20T08:30:00Z', ackRate: '92%' },
  { id: 'm2', type: 'NOTE',         title: 'Great Science session today!',      body: 'Temi showed excellent curiosity during lab.',  target: 'PUPIL',  targetName: 'Temi Adeyemi',   sentAt: '2025-06-20T09:15:00Z', ackRate: '100%' },
  { id: 'm3', type: 'FEE_REMINDER', title: 'Term 2 Fees Outstanding',           body: 'Please clear outstanding fees before Friday.', target: 'SCHOOL', targetName: 'All parents',    sentAt: '2025-06-19T14:00:00Z', ackRate: '74%' },
  { id: 'm4', type: 'ATTENDANCE',   title: 'Absence alert — Chukwu Obi',       body: 'Chukwu was absent today (20 June).',          target: 'PUPIL',  targetName: 'Chukwu Obi',     sentAt: '2025-06-20T07:45:00Z', ackRate: '100%' },
  { id: 'm5', type: 'ANNOUNCEMENT', title: 'PTA Meeting — Saturday 12 July',   body: 'All parents are invited to the PTA meeting.', target: 'SCHOOL', targetName: 'All parents',    sentAt: '2025-06-18T10:00:00Z', ackRate: '61%' },
];

const TYPE_BADGE: Record<MessageType, { label: string; variant: BadgeVariant }> = {
  NOTE:         { label: 'Note',         variant: 'green' },
  HOMEWORK:     { label: 'Homework',     variant: 'blue' },
  BEHAVIOUR:    { label: 'Behaviour',    variant: 'yellow' },
  ATTENDANCE:   { label: 'Attendance',   variant: 'purple' },
  RESULT:       { label: 'Result',       variant: 'gray' },
  ANNOUNCEMENT: { label: 'Broadcast',    variant: 'gray' },
  FEE_REMINDER: { label: 'Fee Reminder', variant: 'yellow' },
  EVENT:        { label: 'Event',        variant: 'blue' },
};

// ── Compose Form ───────────────────────────────────────────────────────────

const MESSAGE_TYPES: MessageType[] = [
  'NOTE', 'HOMEWORK', 'BEHAVIOUR', 'ATTENDANCE',
  'RESULT', 'ANNOUNCEMENT', 'FEE_REMINDER', 'EVENT',
];

const MESSAGE_TARGETS: MessageTarget[] = ['PUPIL', 'CLASS', 'SCHOOL'];

interface FormState {
  type: MessageType;
  target: MessageTarget;
  pupilId: string;
  classId: string;
  title: string;
  body: string;
  dueAt: string;
}

function ComposeForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>({
    type: 'NOTE',
    target: 'CLASS',
    pupilId: '',
    classId: '',
    title: '',
    body: '',
    dueAt: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      type: form.type,
      target: form.target,
      ...(form.target === 'PUPIL' && { pupilId: form.pupilId || undefined }),
      ...(form.target === 'CLASS' && { classId: form.classId || undefined }),
      title: form.title,
      body: form.body || undefined,
      attachments: [],
      ...(form.dueAt && { dueAt: new Date(form.dueAt) }),
    };

    const parsed = CreateMessageDto.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormState;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // TODO: apiFetch<Message>('/messages', { method: 'POST', body: parsed.data })
      await new Promise((r) => setTimeout(r, 800)); // simulated latency
      setSuccess(true);
      setTimeout(onClose, 1000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Message</CardTitle>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close compose form"
        >
          <X size={18} />
        </button>
      </CardHeader>

      {success ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-emerald-600">
            Message sent successfully!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Type + Target row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="msg-type">
                Message type
              </label>
              <div className="relative">
                <select
                  id="msg-type"
                  value={form.type}
                  onChange={(e) => set('type', e.target.value as MessageType)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-9 text-sm text-gray-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {MESSAGE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="msg-target">
                Send to
              </label>
              <div className="relative">
                <select
                  id="msg-target"
                  value={form.target}
                  onChange={(e) => set('target', e.target.value as MessageTarget)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-9 text-sm text-gray-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {MESSAGE_TARGETS.map((t) => (
                    <option key={t} value={t}>{t === 'PUPIL' ? 'Specific Pupil' : t === 'CLASS' ? 'Entire Class' : 'Whole School'}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
              </div>
            </div>
          </div>

          {/* Conditional target fields */}
          {form.target === 'PUPIL' && (
            <Input
              label="Pupil ID"
              id="pupil-id"
              placeholder="UUID of the pupil"
              value={form.pupilId}
              onChange={(e) => set('pupilId', e.target.value)}
              error={errors.pupilId}
              hint="TODO: Replace with pupil search autocomplete"
            />
          )}
          {form.target === 'CLASS' && (
            <Input
              label="Class ID"
              id="class-id"
              placeholder="UUID of the class"
              value={form.classId}
              onChange={(e) => set('classId', e.target.value)}
              error={errors.classId}
              hint="TODO: Replace with class selector dropdown"
            />
          )}

          <Input
            label="Title"
            id="msg-title"
            placeholder="e.g. Maths homework due Friday"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            error={errors.title}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor="msg-body">
              Body <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="msg-body"
              rows={4}
              placeholder="Additional details for the parent…"
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {(form.type === 'HOMEWORK' || form.type === 'EVENT') && (
            <Input
              label="Due / occurrence date"
              id="due-at"
              type="datetime-local"
              value={form.dueAt}
              onChange={(e) => set('dueAt', e.target.value)}
              error={errors.dueAt}
            />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              <Send size={15} aria-hidden />
              Send message
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [composing, setComposing] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            {MOCK_MESSAGES.length} messages sent this term
          </p>
        </div>
        {!composing && (
          <Button size="sm" onClick={() => setComposing(true)}>
            <Plus size={16} aria-hidden />
            Compose
          </Button>
        )}
      </div>

      {/* Compose form */}
      {composing && <ComposeForm onClose={() => setComposing(false)} />}

      {/* Message list */}
      <Card noPadding>
        <CardHeader className="px-6 pt-6">
          <CardTitle>Sent Messages</CardTitle>
        </CardHeader>
        <div className="divide-y divide-gray-50">
          {MOCK_MESSAGES.map((msg) => {
            const badge = TYPE_BADGE[msg.type];
            const sentDate = new Date(msg.sentAt).toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div key={msg.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-start sm:gap-4">
                <div className="w-32 shrink-0 pt-0.5">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{msg.title}</p>
                  {msg.body && (
                    <p className="mt-0.5 text-sm text-gray-400 line-clamp-1">{msg.body}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    To: <span className="font-medium text-gray-600">{msg.targetName}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400 whitespace-nowrap">{sentDate}</p>
                  <p className={clsx('mt-1 text-xs font-medium', parseInt(msg.ackRate) >= 80 ? 'text-emerald-600' : 'text-amber-500')}>
                    {msg.ackRate} ack
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
