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
  CreatePupilDto as CreatePupilSchema,
  UpdatePupilDto as UpdatePupilSchema,
  CreateClassDto as CreateClassSchema,
  UpdateClassDto as UpdateClassSchema,
  CreateSubjectDto as CreateSubjectSchema,
  UpdateSubjectDto as UpdateSubjectSchema,
  CreateAcademicYearDto as CreateAcademicYearSchema,
  CreateTermDto as CreateTermSchema,
  EnrollPupilDto as EnrollPupilSchema,
  LinkGuardianDto as LinkGuardianSchema,
  BulkAttendanceDto as BulkAttendanceSchema,
  AttendanceQuery as AttendanceQuerySchema,
  UpsertResultDto as UpsertResultSchema,
  ResultsQuery as ResultsQuerySchema,
  RegisterDeviceTokenDto as RegisterDeviceTokenSchema,
  CreateFeeInvoiceDto as CreateFeeInvoiceSchema,
  FeesQuery as FeesQuerySchema,
  InitPaymentDto as InitPaymentSchema,
  LookupUserQuery as LookupUserQuerySchema,
  UpsertSubscriptionDto as UpsertSubscriptionSchema,
  PresignUploadDto as PresignUploadSchema,
  UpdatePlanDto as UpdatePlanSchema,
  UpsertDaySubjectNoteDto as UpsertDaySubjectNoteSchema,
  UpsertBehaviourRatingDto as UpsertBehaviourRatingSchema,
  SubmitHomeworkDto as SubmitHomeworkSchema,
  CreatePupilBadgeDto as CreatePupilBadgeSchema,
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
export class UpdatePlanDto extends createZodDto(UpdatePlanSchema) {}
export class UpsertDaySubjectNoteDto extends createZodDto(UpsertDaySubjectNoteSchema) {}
export class UpsertBehaviourRatingDto extends createZodDto(UpsertBehaviourRatingSchema) {}
export class SubmitHomeworkDto extends createZodDto(SubmitHomeworkSchema) {}
export class CreatePupilBadgeDto extends createZodDto(CreatePupilBadgeSchema) {}
export class CreatePupilDto extends createZodDto(CreatePupilSchema) {}
export class UpdatePupilDto extends createZodDto(UpdatePupilSchema) {}
export class CreateClassDto extends createZodDto(CreateClassSchema) {}
export class UpdateClassDto extends createZodDto(UpdateClassSchema) {}
export class CreateSubjectDto extends createZodDto(CreateSubjectSchema) {}
export class UpdateSubjectDto extends createZodDto(UpdateSubjectSchema) {}
export class CreateAcademicYearDto extends createZodDto(CreateAcademicYearSchema) {}
export class CreateTermDto extends createZodDto(CreateTermSchema) {}
export class EnrollPupilDto extends createZodDto(EnrollPupilSchema) {}
export class LinkGuardianDto extends createZodDto(LinkGuardianSchema) {}
export class BulkAttendanceDto extends createZodDto(BulkAttendanceSchema) {}
export class AttendanceQueryDto extends createZodDto(AttendanceQuerySchema) {}
export class UpsertResultDto extends createZodDto(UpsertResultSchema) {}
export class ResultsQueryDto extends createZodDto(ResultsQuerySchema) {}
export class RegisterDeviceTokenDto extends createZodDto(RegisterDeviceTokenSchema) {}
export class CreateFeeInvoiceDto extends createZodDto(CreateFeeInvoiceSchema) {}
export class FeesQueryDto extends createZodDto(FeesQuerySchema) {}
export class InitPaymentDto extends createZodDto(InitPaymentSchema) {}
export class LookupUserQueryDto extends createZodDto(LookupUserQuerySchema) {}
export class UpsertSubscriptionDto extends createZodDto(UpsertSubscriptionSchema) {}
export class PresignUploadDto extends createZodDto(PresignUploadSchema) {}
