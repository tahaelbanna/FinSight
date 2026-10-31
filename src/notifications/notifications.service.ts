import { Injectable } from '@nestjs/common';
import { GetNotificationsUseCase } from './usecases/get-notifications.usecase';
import { MarkAsReadUseCase } from './usecases/mark-as-read.usecase';
import { GetNotificationsDto } from './dtos/get-notifications.dto';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { PaginatedResult } from 'src/common/data-access';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly getNotificationsUseCase: GetNotificationsUseCase,
        private readonly markAsReadUseCase: MarkAsReadUseCase,
    ) {}

    async getNotifications(query: GetNotificationsDto, user_id: string): Promise<PaginatedResult<NotificationResponseDto>> {
        return this.getNotificationsUseCase.execute(query, user_id);
    }

    async markAsRead(id: string, user_id: string): Promise<void> {
        return this.markAsReadUseCase.execute(id, user_id);
    }
}