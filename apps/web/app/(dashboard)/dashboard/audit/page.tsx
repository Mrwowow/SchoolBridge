'use client';

import {
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
  Badge,
} from '@/components/ui';
import { useAuditLog } from '@/lib/queries';
import { ApiError } from '@/lib/api';

export default function AuditPage() {
  const { data, isLoading, isError, error } = useAuditLog();
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Recent administrative actions on this school
        </p>
      </div>

      <Card noPadding>
        <Table aria-label="Audit log">
          <TableHead>
            <TableRow>
              <Th>When</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Resource</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {isError ? (
              <TableRow>
                <Td colSpan={4} className="py-10 text-center text-red-500">
                  {error instanceof ApiError ? error.message : 'Failed to load audit log.'}
                </Td>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <Td colSpan={4} className="py-10 text-center text-gray-400">
                  Loading…
                </Td>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <Td colSpan={4} className="py-10 text-center text-gray-400">
                  No audit entries yet.
                </Td>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <Td className="whitespace-nowrap text-xs text-gray-400">
                    {new Date(row.createdAt).toLocaleString('en-NG')}
                  </Td>
                  <Td className="text-gray-900">{row.user?.fullName ?? 'System'}</Td>
                  <Td>
                    <Badge variant="blue">{row.action}</Badge>
                  </Td>
                  <Td className="text-gray-500">
                    {row.resource}
                    {row.resourceId ? (
                      <span className="ml-1 font-mono text-xs text-gray-300">
                        {row.resourceId.slice(0, 8)}
                      </span>
                    ) : null}
                  </Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
