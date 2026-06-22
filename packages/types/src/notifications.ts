import { z } from 'zod';

export const RegisterDeviceTokenDto = z.object({
  token: z.string().min(8),
  platform: z.enum(['ios', 'android', 'web']).optional(),
});
export type RegisterDeviceTokenDto = z.infer<typeof RegisterDeviceTokenDto>;
