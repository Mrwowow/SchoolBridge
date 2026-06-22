/**
 * src/api/tenant.ts
 * Builds school-scoped API paths (/schools/:schoolId/...). The active schoolId
 * comes from the auth store; the client also injects it as the x-school-id
 * header, but tenant-scoped routes need it in the path too.
 */
import { getAuthState } from '../store/authStore';

export function schoolPath(suffix: string): string {
  const { schoolId } = getAuthState();
  return `/schools/${schoolId}${suffix}`;
}
