import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/data-access'; 
import { SystemAdmin } from '../schemas/system-admin.schema';

@Injectable()
export class SystemAdminRepository extends BaseRepository<SystemAdmin> {
    constructor(
        @InjectRepository(SystemAdmin)
        private readonly adminRepository: Repository<SystemAdmin>,
    ) {
        super(adminRepository);
    }
}