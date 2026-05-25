import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Preference, PreferenceDocument } from './schemas/preference.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Preference.name) private readonly preferenceModel: Model<PreferenceDocument>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(dto.userId),
      title: dto.title,
      body: dto.body,
      channels: dto.channels ?? ['in_app'],
      priority: dto.priority ?? 'medium',
      topic: dto.topic,
      metadata: dto.metadata,
    });
    return notification.save();
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: NotificationDocument[]; total: number; page: number; limit: number }> {
    const filter: FilterQuery<NotificationDocument> = { userId: new Types.ObjectId(userId), isDeleted: false };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId), isDeleted: false },
        { status: 'read', readAt: new Date() },
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ userId: new Types.ObjectId(userId), status: { $in: ['pending', 'sent'] }, isDeleted: false })
      .exec();
  }

  async getPreferences(userId: string): Promise<PreferenceDocument | null> {
    return this.preferenceModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  async upsertPreferences(dto: NotificationPreferencesDto): Promise<PreferenceDocument> {
    const userId = new Types.ObjectId(dto.userId);
    const update: Record<string, unknown> = {};

    const topicKeys = ['wallet', 'loan', 'kyc', 'fraud', 'investment', 'marketing'] as const;
    for (const key of topicKeys) {
      if (dto[key]) {
        update[`topics.${key}`] = dto[key];
      }
    }

    if (dto.doNotDisturb !== undefined) {
      update.doNotDisturb = dto.doNotDisturb;
    }
    if (dto.quietHours) {
      update.quietHours = dto.quietHours;
    }

    return this.preferenceModel
      .findOneAndUpdate({ userId }, { $set: update }, { upsert: true, new: true })
      .exec();
  }
}
