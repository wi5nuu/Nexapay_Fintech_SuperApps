import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyTwoFactorDto } from './dto/verify-2fa.dto';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() dto: RefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() dto: RefreshDto,
  ): Promise<{ message: string }> {
    await this.authService.logout(userId, dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({
    status: 200,
    description: '2FA setup data returned',
  })
  async enableTwoFactor(
    @CurrentUser('id') userId: string,
  ): Promise<{ secret: string; qrCode: string }> {
    return this.authService.enableTwoFactor(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and activate two-factor authentication' })
  @ApiResponse({
    status: 200,
    description: '2FA verified and enabled',
  })
  async verifyTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyTwoFactorDto,
  ): Promise<{ message: string }> {
    return this.authService.verifyTwoFactor(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({
    status: 200,
    description: '2FA disabled',
  })
  async disableTwoFactor(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyTwoFactorDto,
  ): Promise<{ message: string }> {
    return this.authService.disableTwoFactor(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user data',
    type: UserEntity,
  })
  async getMe(@CurrentUser('id') userId: string): Promise<UserEntity> {
    return this.authService.getMe(userId);
  }
}
