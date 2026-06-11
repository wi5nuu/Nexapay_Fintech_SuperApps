import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserEntity } from '../../modules/auth/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext): UserEntity | string | boolean | Date | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as UserEntity | undefined;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
