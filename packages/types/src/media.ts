import { z } from 'zod';

/** Request a signed upload payload for a message attachment. */
export const PresignUploadDto = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  /** Bytes — used to enforce a size cap server-side. */
  size: z.coerce.number().int().positive().max(20 * 1024 * 1024), // 20 MB
});
export type PresignUploadDto = z.infer<typeof PresignUploadDto>;

/**
 * Signed direct-upload payload for Cloudinary. The client POSTs
 * multipart/form-data to `uploadUrl` with the file plus every entry in
 * `fields`, then persists the returned `secure_url` in message.attachments.
 */
export interface PresignUploadResult {
  /** Cloudinary upload endpoint to POST the multipart form to. */
  uploadUrl: string;
  /** Signed form fields to send alongside the `file` part. */
  fields: Record<string, string>;
}
