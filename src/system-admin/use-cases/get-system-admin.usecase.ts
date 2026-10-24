import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { SystemAdminRepository } from '../repositories/system-admin.repository';
import { SystemAdmin } from '../schemas/system-admin.schema';
import { SystemAdminResponseDto } from '../dtos/system-admin-response.dto';

@Injectable()
export class GetSystemAdminUseCase {
    constructor(
        private readonly systemAdminRepository: SystemAdminRepository,
    ) {}

    async execute(
        query: FindOptionsWhere<SystemAdmin>,
    ): Promise<SystemAdminResponseDto> {
        const systemAdmin = await this.systemAdminRepository.findOne({
            where: query,
        });
        return plainToInstance(SystemAdminResponseDto, systemAdmin);
    }
}