import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Metadata key used to store required roles on route handlers.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that specifies which roles are required to access a route.
 * Used in conjunction with RolesGuard to enforce role-based access control.
 *
 * @param roles - One or more Role enum values required for access.
 *
 * @example
 * ```typescript
 * @Roles(Role.ADMIN)
 * @Get('admin-only')
 * adminEndpoint() { ... }
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
