import { Injectable } from '@nestjs/common';
import { ForbiddenException } from 'src/common/error-handling/custom-exceptions/forbidden.exception';
import { I18nService } from 'nestjs-i18n';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';

@Injectable()
export class MarkAsReadUseCase {
    constructor(
        private readonly notificationRepository: NotificationRepository,
        private readonly i18nService: I18nService,
    ) {}

    async execute(notification_id: string, user_id: string): Promise<void> {
        const notification =
            await this.notificationRepository.findById(notification_id);

        if (!notification) {
            throw new NotFoundException(
                this.i18nService.translate(
                    'notifications.NOTIFICATION_NOT_FOUND',
                ),
            );
        }

        if (notification.user_id !== user_id) {
            throw new ForbiddenException(
                this.i18nService.translate('auth.FORBIDDEN'),
            );
        }

        if (!notification.is_read) {
            await this.notificationRepository.updateById(notification_id, {
                is_read: true,
                read_at: new Date(),
            });
        }
    }
}
