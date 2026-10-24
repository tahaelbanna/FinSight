import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemAdminService } from './system-admin.service';
import { SystemAdmin } from './schemas/system-admin.schema';
import { GetSystemAdminUseCase } from './use-cases/get-system-admin.usecase';
import { InitializeSystemAdminUseCase } from './use-cases/initialize-system-admin.usecase';
import { SystemAdminRepository } from './repositories/system-admin.repository';

@Module({
    imports: [TypeOrmModule.forFeature([SystemAdmin])],
    providers: [
        SystemAdminService,
        GetSystemAdminUseCase,
        InitializeSystemAdminUseCase,
        SystemAdminRepository,
    ],
    exports: [SystemAdminService],
})
export class SystemAdminModule {}