'use client';

import { useState } from 'react';
import { Send, Plus, X, ChevronDown, Paperclip } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { CreateMessageDto } from '@schoolbridge/types';
import type { MessageType, MessageTarget } from '@schoolbridge/types';
import { useClasses, usePupils, useCreateMessage, useUploadAttachment } from '@/lib/queries';
import { ApiError } from '@/lib/api';

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
  const classes = useClasses();
  const createMessage = useCreateMessage();
  const uploadAttachment = useUploadAttachment();
  const [attachments, setAttachments] = useState<{ key: string; name: string }[]>([]);

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
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pupils for the picker — scoped to the chosen class when one is selected.
  const pupils = usePupils(form.target === 'PUPIL' && form.classId ? form.classId : undefined);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setFormError(null);
    try {
      const { key } = await uploadAttachment.mutateAsync(file);
      setAttachments((prev) => [...prev, { key, name: file.name }]);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Attachment upload failed.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

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

    try {
      await createMessage.mutateAsync({
        type: form.type,
        target: form.target,
        pupilId: form.target === 'PUPIL' ? form.pupilId : undefined,
        classId: form.target === 'CLASS' ? form.classId : undefined,
        title: form.title,
        body: form.body || undefined,
        attachments: attachments.map((a) => a.key),
      });
      setSuccess(true);
      setTimeout(onClose, 1000);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not send the message.');
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
          <p className="text-sm font-medium text-emerald-600">Message sent — parents are notified.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {formError}
            </div>
          )}

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
                    <option key={t} value={t}>
                      {t === 'PUPIL' ? 'Specific Pupil' : t === 'CLASS' ? 'Entire Class' : 'Whole School'}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
              </div>
            </div>
          </div>

          {/* Class picker — shown for CLASS target, and to scope the pupil list for PUPIL target */}
          {(form.target === 'CLASS' || form.target === 'PUPIL') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="class-sel">
                {form.target === 'CLASS' ? 'Class' : 'Class (to find the pupil)'}
              </label>
              <select
                id="class-sel"
                value={form.classId}
                onChange={(e) => {
                  set('classId', e.target.value);
                  set('pupilId', '');
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select a class…</option>
                {(classes.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.classId && <p className="text-xs text-red-500">{errors.classId}</p>}
            </div>
          )}

          {form.target === 'PUPIL' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="pupil-sel">Pupil</label>
              <select
                id="pupil-sel"
                value={form.pupilId}
                onChange={(e) => set('pupilId', e.target.value)}
                disabled={!form.classId}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {form.classId ? 'Select a pupil…' : 'Choose a class first'}
                </option>
                {(pupils.data?.items ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
              {errors.pupilId && <p className="text-xs text-red-500">{errors.pupilId}</p>}
            </div>
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

          {/* Attachments */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Attachments <span className="text-gray-400">(images or PDF)</span>
            </label>
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
              <Paperclip size={15} aria-hidden />
              {uploadAttachment.isPending ? 'Uploading…' : 'Add file'}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadAttachment.isPending}
              />
            </label>
            {attachments.length > 0 && (
              <ul className="flex flex-col gap-1 pt-1">
                {attachments.map((a) => (
                  <li
                    key={a.key}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600"
                  >
                    <span className="truncate">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.key !== a.key))}
                      className="text-gray-400 hover:text-red-500"
                      aria-label={`Remove ${a.name}`}
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createMessage.isPending}>
              <Send size={15} aria-hidden />
              Send message
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function MessagesPage() {
  const [composing, setComposing] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Post notes, homework, results and broadcasts to parents
          </p>
        </div>
        {!composing && (
          <Button size="sm" onClick={() => setComposing(true)}>
            <Plus size={16} aria-hidden />
            Compose
          </Button>
        )}
      </div>

      {composing && <ComposeForm onClose={() => setComposing(false)} />}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <p className="px-1 py-6 text-center text-sm text-gray-400">
          Sent messages appear in each pupil&apos;s feed. Use the parent app or a pupil&apos;s profile
          to review delivery and acknowledgements.
        </p>
      </Card>
    </div>
  );
}
