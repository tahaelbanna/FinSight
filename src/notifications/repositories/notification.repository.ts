import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/common/data-access';
import { Notification } from '../schemas/notification.schema';

@Injectable()
export class NotificationRepository extends BaseRepository<Notification> {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) {
        super(notificationRepository);
    }
}