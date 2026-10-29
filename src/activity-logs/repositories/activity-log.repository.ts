import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/common/data-access';
import { ActivityLog } from '../schemas/activity-log.schema';

@Injectable()
export class ActivityLogRepository extends BaseRepository<ActivityLog> {
    constructor(
        @InjectRepository(ActivityLog)
        private readonly activityLogRepository: Repository<ActivityLog>,
    ) {
        super(activityLogRepository);
    }
}