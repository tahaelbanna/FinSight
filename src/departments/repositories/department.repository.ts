import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/data-access';
import { Department } from '../schemas/departments.schema';

@Injectable()
export class DepartmentRepository extends BaseRepository<Department> {
    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) {
        super(departmentRepository);
    }
}