import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { GetActivityLogsDto } from './dtos/get-activity-logs.dto';
import { ActivityLogResponseDto } from './dtos/activity-log-response.dto';
import { PaginatedResult } from 'src/common/data-access';
import { AllowRoles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser, Principal } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums';

@Controller('activity-logs')
export class ActivityLogsController {
    constructor(private readonly activityLogsService: ActivityLogsService) {}

    @Get()
    @AllowRoles(UserRole.ADMIN, UserRole.FINANCE_OFFICER, UserRole.MANAGER)
    async getAllActivityLogs(
        @Query() query: GetActivityLogsDto,
        @CurrentUser() principal: Principal,
    ): Promise<PaginatedResult<ActivityLogResponseDto>> {
        return this.activityLogsService.getAllActivityLogs(query, principal.user.user_id);
    }
}