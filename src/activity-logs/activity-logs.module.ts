import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLog } from './schemas/activity-log.schema';
import { ActivityLogRepository } from './repositories/activity-log.repository';
import { GetAllActivityLogsUseCase } from './usecases/get-all-activity-logs.usecase';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ActivityLog]),
        UsersModule,
    ],
    controllers: [ActivityLogsController],
    providers: [
        ActivityLogsService,
        ActivityLogRepository,
        GetAllActivityLogsUseCase,
    ],
    exports: [ActivityLogRepository],
})
export class ActivityLogsModule {}