import { createZodDto } from 'nestjs-zod';
import {
  RegisterDto as RegisterSchema,
  LoginDto as LoginSchema,
  RequestOtpDto as RequestOtpSchema,
  VerifyOtpDto as VerifyOtpSchema,
  CreateMessageDto as CreateMessageSchema,
  ReplyDto as ReplySchema,
  PaginationQuery as PaginationQuerySchema,
  CreateSchoolDto as CreateSchoolSchema,
  UpdateSchoolDto as UpdateSchoolSchema,
  AddMemberDto as AddMemberSchema,
} from '@schoolbridge/types';

/**
 * NestJS DTO classes generated from the shared Zod schemas in
 * @schoolbridge/types. These wrappers give @nestjs/swagger something to
 * reflect on (so request bodies/queries render in the OpenAPI docs) while the
 * Zod schema remains the single source of truth for validation.
 *
 * Used together with `ZodValidationPipe` (registered globally) which validates
 * the request against the schema attached to each class.
 */

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class RequestOtpDto extends createZodDto(RequestOtpSchema) {}
export class VerifyOtpDto extends createZodDto(VerifyOtpSchema) {}
export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}
export class ReplyDto extends createZodDto(ReplySchema) {}
export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}
export class CreateSchoolDto extends createZodDto(CreateSchoolSchema) {}
export class UpdateSchoolDto extends createZodDto(UpdateSchoolSchema) {}
export class AddMemberDto extends createZodDto(AddMemberSchema) {}
