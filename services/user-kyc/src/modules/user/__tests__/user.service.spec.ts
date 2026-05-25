import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { LoggerService } from '../../../common/logger.service';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 'user-1',
    email: 'test@nexapay.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatarUrl: null,
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    kyc: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(UserRepository);
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      const dto = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };

      repository.findById.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', dto);

      expect(result.firstName).toBe('Jane');
      expect(repository.update).toHaveBeenCalledWith('user-1', dto);
    });

    it('should throw when user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', { firstName: 'Jane' }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status', async () => {
      const updatedUser = { ...mockUser, status: 'SUSPENDED' };

      repository.findById.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserStatus('user-1', 'SUSPENDED');

      expect(result.status).toBe('SUSPENDED');
    });
  });
});
