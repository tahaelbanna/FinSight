import { Injectable, Logger } from '@nestjs/common';
import { SystemAdminRepository } from '../repositories/system-admin.repository';
import { ConfigService } from '@nestjs/config';
import {
    EnvironmentInterface,
    ISystemAdmin,
} from '../../common/configuration/environment.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InitializeSystemAdminUseCase {
    private logger = new Logger(InitializeSystemAdminUseCase.name);
    constructor(
        private readonly systemAdminRepository: SystemAdminRepository,
        private readonly configService: ConfigService<EnvironmentInterface>,
    ) {}
    async execute(): Promise<void> {
        const { name, email, password } =
            this.configService.getOrThrow<ISystemAdmin>('systemAdmin');

        const isSystemAdminExists = await this.systemAdminRepository.findOne({
            where: { email: email },
        });

        if (isSystemAdminExists) {
            this.logger.log('System admin already initialized');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.systemAdminRepository.create({
            name,
            email,
            password_hash: hashedPassword,
            is_super_admin: true,
        });
        this.logger.log('System admin initialized Successfully!');
    }
}
