import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dtos/get-notifications.dto';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { PaginatedResult } from 'src/common/data-access';
import { CurrentUser, Principal } from 'src/auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    async getMyNotifications(
        @Query() query: GetNotificationsDto,
        @CurrentUser() principal: Principal,
    ): Promise<PaginatedResult<NotificationResponseDto>> {
        return this.notificationsService.getNotifications(query, principal.user.user_id);
    }

    @Patch(':id/read')
    async markAsRead(
        @Param('id') id: string,
        @CurrentUser() principal: Principal,
    ): Promise<void> {
        return this.notificationsService.markAsRead(id, principal.user.user_id);
    }
}