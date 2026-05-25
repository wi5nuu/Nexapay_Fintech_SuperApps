import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { UserRepository } from './user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserStatus } from './entities/user.entity';
import { LoggerService } from '../../common/logger.service';

@Injectable()
export class UserService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService,
  ) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
    this.bucket = process.env.S3_AVATAR_BUCKET ?? 'nexapay-avatars';
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userRepository.update(userId, dto);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    const resizedBuffer = await sharp(file.buffer)
      .resize(256, 256, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const key = `avatars/${userId}/${uuid()}.jpeg`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: resizedBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });

    await this.s3.send(command);

    const avatarUrl = `https://${this.bucket}.s3.${process.env.AWS_REGION ?? 'us-east-1'}.amazonaws.com/${key}`;

    await this.userRepository.update(userId, { avatarUrl });

    this.logger.log(`Avatar uploaded for user ${userId}`, 'UserService');

    return { avatarUrl };
  }

  async updateUserStatus(userId: string, status: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userRepository.update(userId, { status: status as UserStatus });
  }
}
