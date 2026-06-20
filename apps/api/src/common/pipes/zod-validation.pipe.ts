import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * ZodValidationPipe validates incoming data against a Zod schema from
 * @schoolbridge/types. Usage:
 *
 *   @Body(new ZodValidationPipe(LoginDto))
 *   body: LoginDto
 *
 * This keeps DTO validation co-located with the shared contract types rather
 * than duplicated in class-validator decorators.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new BadRequestException({ message: 'Validation failed', errors });
    }
    return result.data;
  }
}
