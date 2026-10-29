import { Injectable } from '@nestjs/common';
import { GetAllActivityLogsUseCase } from './usecases/get-all-activity-logs.usecase';
import { GetActivityLogsDto } from './dtos/get-activity-logs.dto';
import { ActivityLogResponseDto } from './dtos/activity-log-response.dto';
import { PaginatedResult } from 'src/common/data-access';

@Injectable()
export class ActivityLogsService {
    constructor(
        private readonly getAllActivityLogsUseCase: GetAllActivityLogsUseCase,
    ) {}

    async getAllActivityLogs(
        query: GetActivityLogsDto,
        user_id: string,
    ): Promise<PaginatedResult<ActivityLogResponseDto>> {
        return this.getAllActivityLogsUseCase.execute(query, user_id);
    }
}