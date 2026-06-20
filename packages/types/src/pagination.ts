import { z } from 'zod';

export const PaginationQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
