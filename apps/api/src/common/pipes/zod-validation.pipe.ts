import { BadRequestException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

/**
 * Global validation pipe for Zod-based DTOs (createZodDto classes from
 * `common/dto`). It reads the Zod schema attached to each DTO class by
 * `nestjs-zod`, validates the incoming body/query against it, and on failure
 * throws a BadRequestException with our standard shape:
 *
 *   { message: 'Validation failed', errors: [{ field, message }] }
 *
 * Non-Zod arguments (primitive @Param/@Query, plain classes) pass through
 * untouched, so it is safe to register globally.
 */
export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) =>
    new BadRequestException({
      message: 'Validation failed',
      errors: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    }),
});
