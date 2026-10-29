import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLog } from './schemas/activity-log.schema';
import { ActivityLogRepository } from './repositories/activity-log.repository';
import { GetAllActivityLogsUseCase } from './usecases/get-all-activity-logs.usecase';
import { UsersModule } from 'src/users/users.module';
import { forwardRef, Module } from '@nestjs/common';
@Module({
    imports: [
        TypeOrmModule.forFeature([ActivityLog]),
        forwardRef(() => UsersModule),
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