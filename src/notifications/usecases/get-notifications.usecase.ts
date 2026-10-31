import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FindOptionsWhere } from 'typeorm';
import { PaginatedResult } from 'src/common/data-access';
import { NotificationRepository } from '../repositories/notification.repository';
import { GetNotificationsDto } from '../dtos/get-notifications.dto';
import { NotificationResponseDto } from '../dtos/notification-response.dto';
import { Notification } from '../schemas/notification.schema';
import { ExpenseStatus, NotificationType } from 'src/common/enums';

@Injectable()
export class GetNotificationsUseCase {
    constructor(
        private readonly notificationRepository: NotificationRepository,
    ) {}

    async execute(
        query: GetNotificationsDto,
        user_id: string,
    ): Promise<PaginatedResult<NotificationResponseDto>> {
        const where: FindOptionsWhere<Notification> = { user_id };

        if (typeof query.isRead === 'boolean') {
            where.is_read = query.isRead;
        }

        const result = await this.notificationRepository.findPaginated({
            where,
            page: query.page || 1,
            limit: query.limit || 10,
            order: { created_at: 'DESC' },
        });

        const formattedData = result.data.map((notif) => ({
            ...notif,
            expenseStatus:
                notif.type === NotificationType.EXPENSE_APPROVED
                    ? ExpenseStatus.APPROVED
                    : ExpenseStatus.REJECTED,
        }));

        return {
            ...result,
            data: plainToInstance(NotificationResponseDto, formattedData, {
                excludeExtraneousValues: true,
            }),
        };
    }
}
