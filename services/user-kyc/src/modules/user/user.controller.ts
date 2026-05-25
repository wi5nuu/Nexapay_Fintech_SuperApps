import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AvatarUploadDto } from './dto/avatar-upload.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: Request) {
    const userId = req['userId'] as string;
    return this.userService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req['userId'] as string;
    return this.userService.updateProfile(userId, dto);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AvatarUploadDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req['userId'] as string;
    return this.userService.uploadAvatar(userId, file);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin/compliance)' })
  async getUserById(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (admin)' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.userService.updateUserStatus(id, status);
  }
}
