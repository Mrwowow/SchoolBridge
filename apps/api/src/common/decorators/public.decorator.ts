import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/jwt-auth.guard';

/**
 * Mark a route as publicly accessible (skips JwtAuthGuard).
 *
 * Usage:
 *   @Public()
 *   @Get('health')
 *   getHealth() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
