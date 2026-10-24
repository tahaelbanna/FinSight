import { Injectable, OnModuleInit } from '@nestjs/common';
import { InitializeSystemAdminUseCase } from './use-cases/initialize-system-admin.usecase';
import { GetSystemAdminUseCase } from './use-cases/get-system-admin.usecase';
import { SystemAdminResponseDto } from './dtos/system-admin-response.dto';
import { SystemAdmin } from './schemas/system-admin.schema';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class SystemAdminService implements OnModuleInit {
    constructor(
        private readonly initializeSystemAdminUseCase: InitializeSystemAdminUseCase,
        private readonly getSystemAdminUseCase: GetSystemAdminUseCase,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.initializeSystemAdminUseCase.execute();
    }

    async getSystemAdmin(
        query: FindOptionsWhere<SystemAdmin>,
    ): Promise<SystemAdminResponseDto> {
        return this.getSystemAdminUseCase.execute(query);
    }
}
