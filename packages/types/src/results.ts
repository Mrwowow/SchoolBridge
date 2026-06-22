import { z } from 'zod';

const id = () => z.string().min(1);

/**
 * Assessment result entry. The API upserts on (termId, pupilId, subjectId),
 * so re-submitting corrects an existing score.
 */
export const UpsertResultDto = z
  .object({
    termId: id(),
    pupilId: id(),
    subjectId: id(),
    score: z.coerce.number().min(0).max(100),
    maxScore: z.coerce.number().positive().max(100).default(100),
    grade: z.string().max(4).optional(),
    remarks: z.string().max(500).optional(),
  })
  .refine((d) => d.score <= d.maxScore, {
    message: 'score cannot exceed maxScore',
    path: ['score'],
  });
export type UpsertResultDto = z.infer<typeof UpsertResultDto>;

export const ResultsQuery = z.object({
  pupilId: id().optional(),
  termId: id().optional(),
  subjectId: id().optional(),
});
export type ResultsQuery = z.infer<typeof ResultsQuery>;
