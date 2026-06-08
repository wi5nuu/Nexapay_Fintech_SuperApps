import { User } from '@prisma/client';
import { UserDto } from '../../modules/auth/dto/user.dto';

/**
 * Manual mapper for User Entity to User DTO.
 */
export class UserMapper {
  static toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles as string[],
      createdAt: user.createdAt,
    };
  }
}
