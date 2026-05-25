import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to mark routes as public (no authentication required).
 * Checked by JwtAuthGuard to skip JWT validation.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator that marks a route handler as publicly accessible.
 * When applied, the JwtAuthGuard will skip authentication for that route.
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * healthCheck() { return 'OK'; }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
