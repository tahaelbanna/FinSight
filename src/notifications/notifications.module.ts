import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';
import { NotificationRepository } from './repositories/notification.repository';
import { GetNotificationsUseCase } from './usecases/get-notifications.usecase';
import { MarkAsReadUseCase } from './usecases/mark-as-read.usecase';

@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        NotificationRepository,
        GetNotificationsUseCase,
        MarkAsReadUseCase,
    ],
})
export class NotificationsModule {}
