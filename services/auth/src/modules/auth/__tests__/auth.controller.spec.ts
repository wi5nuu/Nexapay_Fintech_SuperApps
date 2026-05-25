import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoggerService } from '../../../common/logger.service';
import { HttpExceptionFilter } from '../../../common/filters/http-exception.filter';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
  }));
});

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    enableTwoFactor: jest.fn(),
    verifyTwoFactor: jest.fn(),
    disableTwoFactor: jest.fn(),
    getMe: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'StrongP@ss1',
        name: 'New User',
      };

      const expectedResponse = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'new@example.com',
          name: 'New User',
          role: 'USER',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual(expectedResponse);
    });

    it('should return 400 for invalid email', async () => {
      const invalidDto = {
        email: 'not-an-email',
        password: 'StrongP@ss1',
        name: 'Test',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for weak password', async () => {
      const weakPasswordDto = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordDto)
        .expect(400);
    });

    it('should return 400 when name is missing', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'StrongP@ss1',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'StrongP@ss1',
      };

      const expectedResponse = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toEqual(expectedResponse);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body.accessToken).toBe('new-access-token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 401 without auth header', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'token' })
        .expect(401);
    });
  });

  describe('POST /auth/2fa/enable', () => {
    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/auth/2fa/enable')
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('POST /auth/2fa/verify', () => {
    it('should return 400 for invalid 2FA code length', async () => {
      await request(app.getHttpServer())
        .post('/auth/2fa/verify')
        .send({ code: '123' })
        .expect(401);
    });
  });
});
