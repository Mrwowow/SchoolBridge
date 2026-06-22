'use client';

import { useState, type FormEvent } from 'react';
import { Plus, X, ExternalLink } from 'lucide-react';
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
  useFees,
  usePupils,
  useCreateInvoice,
  usePayInvoice,
  type FeeInvoiceRow,
} from '@/lib/queries';
import { useSession } from '@/lib/session';
import { ApiError } from '@/lib/api';

const STATUS_VARIANT: Record<FeeInvoiceRow['status'], BadgeVariant> = {
  PENDING: 'yellow',
  PAID: 'green',
  FAILED: 'red',
  REFUNDED: 'gray',
};

function formatNaira(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
}

export default function FeesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useSession();
  const { data, isLoading, isError, error } = useFees();
  const pay = usePayInvoice();
  const [payError, setPayError] = useState<string | null>(null);

  const invoices = data ?? [];
  const outstanding = invoices
    .filter((i) => i.status === 'PENDING')
    .reduce((sum, i) => sum + i.amountKobo, 0);

  async function handlePay(invoice: FeeInvoiceRow) {
    setPayError(null);
    const email = user?.email ?? '';
    if (!email) {
      setPayError('Add an email to your account to initialise payments.');
      return;
    }
    try {
      const res = await pay.mutateAsync({ invoiceId: invoice.id, email });
      window.open(res.authorizationUrl, '_blank', 'noopener');
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Could not start payment.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading…' : `${formatNaira(outstanding)} outstanding`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} aria-hidden />
          New Invoice
        </Button>
      </div>

      {payError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {payError}
        </div>
      )}

      <Card noPadding>
        <Table aria-label="Fee invoices">
          <TableHead>
            <TableRow>
              <Th>Pupil</Th>
              <Th>Description</Th>
              <Th>Amount</Th>
              <Th>Due</Th>
              <Th>Status</Th>
              <Th> </Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isError ? (
              <TableRow>
                <Td colSpan={6} className="py-10 text-center text-red-500">
                  {error instanceof ApiError ? error.message : 'Failed to load fees.'}
                </Td>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <Td colSpan={6} className="py-10 text-center text-gray-400">
                  Loading invoices…
                </Td>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <Td colSpan={6} className="py-10 text-center text-gray-400">
                  No invoices yet.
                </Td>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <Td className="font-medium text-gray-900">{inv.pupil.fullName}</Td>
                  <Td>{inv.description}</Td>
                  <Td className="font-mono text-sm">{formatNaira(inv.amountKobo)}</Td>
                  <Td className="text-xs text-gray-400">
                    {new Date(inv.dueAt).toLocaleDateString('en-NG')}
                  </Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[inv.status]} dot>
                      {inv.status}
                    </Badge>
                  </Td>
                  <Td>
                    {inv.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePay(inv)}
                        loading={pay.isPending && pay.variables?.invoiceId === inv.id}
                      >
                        <ExternalLink size={13} aria-hidden />
                        Pay
                      </Button>
                    )}
                  </Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {showAdd && <AddInvoiceModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddInvoiceModal({ onClose }: { onClose: () => void }) {
  const pupils = usePupils();
  const createInvoice = useCreateInvoice();
  const [pupilId, setPupilId] = useState('');
  const [description, setDescription] = useState('');
  const [amountNaira, setAmountNaira] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const naira = Number(amountNaira);
    if (!pupilId) return setFormError('Select a pupil.');
    if (description.trim().length < 2) return setFormError('Enter a description.');
    if (!Number.isFinite(naira) || naira <= 0) return setFormError('Enter a valid amount.');
    if (!dueAt) return setFormError('Choose a due date.');

    try {
      await createInvoice.mutateAsync({
        pupilId,
        description: description.trim(),
        amountKobo: Math.round(naira * 100),
        dueAt: new Date(dueAt).toISOString(),
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create invoice.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">New invoice</h2>
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
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Pupil</label>
            <select
              value={pupilId}
              onChange={(e) => setPupilId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select a pupil…</option>
              {(pupils.data?.items ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. First Term school fees"
            required
          />
          <Input
            label="Amount (₦)"
            type="number"
            min="1"
            value={amountNaira}
            onChange={(e) => setAmountNaira(e.target.value)}
            placeholder="e.g. 25000"
            required
          />
          <Input
            label="Due date"
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            required
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createInvoice.isPending}>
              Create invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
