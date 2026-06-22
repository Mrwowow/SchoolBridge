'use client';

/**
 * Typed react-query hooks over the scoped SchoolBridge API.
 * Every hook is keyed by the active schoolId so switching schools refetches.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';
import { useSession } from './session';
import type { Paginated } from '@schoolbridge/types';

// ── Shared response shapes (mirror the API selects) ──────────────────────────

export interface PupilRow {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  admissionNo: string | null;
  createdAt: string;
}

export interface ClassRow {
  id: string;
  name: string;
  classTeacherId: string | null;
  _count: { enrollments: number };
}

export interface AttendanceRow {
  id: string;
  pupilId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note: string | null;
  pupil: { id: string; fullName: string };
}

export interface ResultRow {
  id: string;
  pupilId: string;
  termId: string;
  subjectId: string;
  score: string;
  maxScore: string;
  grade: string | null;
  remarks: string | null;
  subject: { id: string; name: string };
  pupil: { id: string; fullName: string };
}

export interface MessageRow {
  id: string;
  type: string;
  target: string;
  title: string;
  body: string | null;
  createdAt: string;
  author: { id: string; fullName: string };
  receipts: { acknowledgedAt: string | null }[];
}

// ── Pupils ───────────────────────────────────────────────────────────────────

export function usePupils(classId?: string) {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['pupils', schoolId, classId ?? null],
    enabled: !!schoolId,
    queryFn: () => {
      const qs = new URLSearchParams({ limit: '100' });
      if (classId) qs.set('classId', classId);
      return apiFetch<Paginated<PupilRow>>(`/schools/${schoolId}/pupils?${qs.toString()}`);
    },
  });
}

export function useCreatePupil() {
  const { schoolId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      fullName: string;
      admissionNo?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      dateOfBirth?: string;
    }) => apiFetch<PupilRow>(`/schools/${schoolId}/pupils`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pupils', schoolId] }),
  });
}

// ── Classes ──────────────────────────────────────────────────────────────────

export function useClasses() {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['classes', schoolId],
    enabled: !!schoolId,
    queryFn: () => apiFetch<ClassRow[]>(`/schools/${schoolId}/classes`),
  });
}

export function useCreateClass() {
  const { schoolId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; classTeacherId?: string }) =>
      apiFetch<ClassRow>(`/schools/${schoolId}/classes`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes', schoolId] }),
  });
}

// ── Attendance ───────────────────────────────────────────────────────────────

export function useAttendance(params: { classId?: string; from?: string; to?: string }) {
  const { schoolId } = useSession();
  const enabled = !!schoolId && !!params.classId;
  return useQuery({
    queryKey: ['attendance', schoolId, params],
    enabled,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.classId) qs.set('classId', params.classId);
      if (params.from) qs.set('from', params.from);
      if (params.to) qs.set('to', params.to);
      return apiFetch<AttendanceRow[]>(`/schools/${schoolId}/attendance?${qs.toString()}`);
    },
  });
}

export function useRecordAttendance() {
  const { schoolId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      termId: string;
      classRoomId: string;
      date: string;
      entries: { pupilId: string; status: string; note?: string }[];
    }) => apiFetch(`/schools/${schoolId}/attendance/bulk`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance', schoolId] }),
  });
}

// ── Results ──────────────────────────────────────────────────────────────────

export function useResults(params: { pupilId?: string; termId?: string }) {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['results', schoolId, params],
    enabled: !!schoolId,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.pupilId) qs.set('pupilId', params.pupilId);
      if (params.termId) qs.set('termId', params.termId);
      return apiFetch<ResultRow[]>(`/schools/${schoolId}/results?${qs.toString()}`);
    },
  });
}

// ── Academic (terms) ─────────────────────────────────────────────────────────

export interface AcademicYearRow {
  id: string;
  label: string;
  isCurrent: boolean;
  terms: { id: string; label: string; isCurrent: boolean }[];
}

export function useAcademicYears() {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['academic', schoolId],
    enabled: !!schoolId,
    queryFn: () => apiFetch<AcademicYearRow[]>(`/schools/${schoolId}/academic/years`),
  });
}

/** Convenience: the current term across all years, if one is marked current. */
export function useCurrentTerm() {
  const years = useAcademicYears();
  const term = years.data
    ?.flatMap((y) => y.terms)
    .find((t) => t.isCurrent) ?? null;
  return { term, ...years };
}

// ── Messages ─────────────────────────────────────────────────────────────────

export function useCreateMessage() {
  const { schoolId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      type: string;
      target: string;
      pupilId?: string;
      classId?: string;
      title: string;
      body?: string;
      attachments?: string[];
    }) => apiFetch<{ id: string }>(`/schools/${schoolId}/messages`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', schoolId] }),
  });
}

// ── Fees ─────────────────────────────────────────────────────────────────────

export interface FeeInvoiceRow {
  id: string;
  description: string;
  amountKobo: number;
  dueAt: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  pupil: { id: string; fullName: string };
}

export function useFees(params: { status?: string; pupilId?: string } = {}) {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['fees', schoolId, params],
    enabled: !!schoolId,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.status) qs.set('status', params.status);
      if (params.pupilId) qs.set('pupilId', params.pupilId);
      return apiFetch<FeeInvoiceRow[]>(`/schools/${schoolId}/fees?${qs.toString()}`);
    },
  });
}

export function useCreateInvoice() {
  const { schoolId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      pupilId: string;
      description: string;
      amountKobo: number;
      dueAt: string;
    }) => apiFetch<FeeInvoiceRow>(`/schools/${schoolId}/fees`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fees', schoolId] }),
  });
}

export function usePayInvoice() {
  const { schoolId } = useSession();
  return useMutation({
    mutationFn: (vars: { invoiceId: string; email: string; callbackUrl?: string }) =>
      apiFetch<{ authorizationUrl: string; reference: string }>(
        `/schools/${schoolId}/fees/${vars.invoiceId}/pay`,
        { method: 'POST', body: { email: vars.email, callbackUrl: vars.callbackUrl } },
      ),
  });
}

// ── Members / staff ──────────────────────────────────────────────────────────

export interface MemberRow {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; fullName: string; phone: string; email: string | null };
}

export function useMembers() {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['members', schoolId],
    enabled: !!schoolId,
    queryFn: () => apiFetch<MemberRow[]>(`/schools/${schoolId}/members`),
  });
}

export interface UserLookup {
  id: string;
  fullName: string;
  phone: string;
  alreadyMember: boolean;
  existingRoles: string[];
}

/** Imperative lookup of a user by phone (admin adding staff). */
export function useLookupUser() {
  const { schoolId } = useSession();
  return useMutation({
    mutationFn: (phone: string) =>
      apiFetch<UserLookup>(
        `/schools/${schoolId}/users/lookup?phone=${encodeURIComponent(phone)}`,
      ),
  });
}

export function useAddMember() {
  const { schoolId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { userId: string; role: string }) =>
      apiFetch(`/schools/${schoolId}/members`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', schoolId] }),
  });
}

export function useRemoveMember() {
  const { schoolId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; role: string }) =>
      apiFetch(`/schools/${schoolId}/members/${vars.userId}`, {
        method: 'DELETE',
        body: { role: vars.role },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', schoolId] }),
  });
}

// ── School profile (settings) ─────────────────────────────────────────────────

export interface SchoolDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
}

export function useSchool() {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['school', schoolId],
    enabled: !!schoolId,
    queryFn: () => apiFetch<SchoolDetail>(`/schools/${schoolId}`),
  });
}

export function useUpdateSchool() {
  const { schoolId } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; settings?: Record<string, unknown> }) =>
      apiFetch<SchoolDetail>(`/schools/${schoolId}`, { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', schoolId] });
    },
  });
}

// ── Super admin: platform & cross-tenant school management ────────────────────

export interface SchoolListRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  _count: { memberships: number; pupils: number };
}

export function useAllSchools() {
  return useQuery({
    queryKey: ['allSchools'],
    queryFn: () => apiFetch<SchoolListRow[]>('/schools'),
  });
}

export function useCreateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; slug: string; plan?: string }) =>
      apiFetch<SchoolDetail>('/schools', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allSchools'] });
      qc.invalidateQueries({ queryKey: ['platformOverview'] });
    },
  });
}

/** Update a specific school's plan/status (PATCH requires that school's x-school-id). */
export function useUpdateSchoolById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; plan?: string; status?: string }) =>
      apiFetch<SchoolDetail>(`/schools/${vars.id}`, {
        method: 'PATCH',
        schoolId: vars.id,
        body: { ...(vars.plan ? { plan: vars.plan } : {}), ...(vars.status ? { status: vars.status } : {}) },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allSchools'] });
      qc.invalidateQueries({ queryKey: ['platformOverview'] });
    },
  });
}

export interface PlatformOverview {
  totals: {
    schools: number;
    activeSchools: number;
    suspendedSchools: number;
    churnedSchools: number;
    pupils: number;
    users: number;
    messages: number;
  };
  schoolsByStatus: Record<string, number>;
  schoolsByPlan: Record<string, number>;
  recentSchools: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    createdAt: string;
    _count: { pupils: number };
  }[];
}

export function usePlatformOverview() {
  return useQuery({
    queryKey: ['platformOverview'],
    queryFn: () => apiFetch<PlatformOverview>('/platform/overview'),
  });
}

// ── Subscriptions (super admin) ──────────────────────────────────────────────

export interface SubscriptionRow {
  id: string;
  schoolId: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  school: { id: string; name: string; slug: string; status: string };
}

export function useSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => apiFetch<SubscriptionRow[]>('/subscriptions'),
  });
}

export function useUpsertSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      schoolId: string;
      plan: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
    }) => apiFetch('/subscriptions', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      qc.invalidateQueries({ queryKey: ['allSchools'] });
    },
  });
}

// ── Plan catalog (super admin) ───────────────────────────────────────────────

export interface PlanRow {
  tier: string;
  name: string;
  description: string;
  priceNaira: number;
  billingInterval: 'MONTHLY' | 'YEARLY';
  maxPupils: number | null;
  maxStaff: number | null;
  smsQuota: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePlanBody {
  name?: string;
  description?: string;
  priceNaira?: number;
  billingInterval?: 'MONTHLY' | 'YEARLY';
  maxPupils?: number | null;
  maxStaff?: number | null;
  smsQuota?: number | null;
  isActive?: boolean;
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => apiFetch<PlanRow[]>('/plans'),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tier: string; body: UpdatePlanBody }) =>
      apiFetch<PlanRow>(`/plans/${vars.tier}`, { method: 'PATCH', body: vars.body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

// ── Engagement analytics (school) ────────────────────────────────────────────

export interface SchoolAnalytics {
  roster: { pupils: number; classes: number; linkedGuardians: number };
  messaging: {
    total: number;
    receipts: number;
    readRate: number;
    ackRate: number;
    byType: Record<string, number>;
  };
  attendance: {
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
    total: number;
    presentRate: number;
  };
}

export function useSchoolAnalytics() {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['analytics', schoolId],
    enabled: !!schoolId,
    queryFn: () => apiFetch<SchoolAnalytics>(`/schools/${schoolId}/analytics`),
  });
}

// ── Audit log (school) ───────────────────────────────────────────────────────

export interface AuditRow {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
  user: { id: string; fullName: string } | null;
}

export function useAuditLog() {
  const { schoolId } = useSession();
  return useQuery({
    queryKey: ['audit', schoolId],
    enabled: !!schoolId,
    queryFn: () => apiFetch<AuditRow[]>(`/schools/${schoolId}/audit`),
  });
}

// ── Media upload (presigned) ─────────────────────────────────────────────────

export interface SignResult {
  uploadUrl: string;
  fields: Record<string, string>;
}

/**
 * Get a signed Cloudinary payload from the API, then POST the file directly to
 * Cloudinary. Resolves to the stored secure URL (saved in message.attachments).
 */
export function useUploadAttachment() {
  const { schoolId } = useSession();
  return useMutation({
    mutationFn: async (file: File) => {
      const sign = await apiFetch<SignResult>(`/schools/${schoolId}/media/sign`, {
        method: 'POST',
        body: { fileName: file.name, contentType: file.type, size: file.size },
      });

      const formData = new FormData();
      formData.append('file', file);
      for (const [k, v] of Object.entries(sign.fields)) formData.append(k, v);

      const res = await fetch(sign.uploadUrl, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const json = (await res.json()) as { secure_url: string };
      return { key: json.secure_url, getUrl: json.secure_url };
    },
  });
}
