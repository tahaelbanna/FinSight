import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/data-access';
import { Project } from '../schemas/project.schema';

@Injectable()
export class ProjectRepository extends BaseRepository<Project> {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
    ) {
        super(projectRepository);
    }
}