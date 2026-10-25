import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/data-access';
import { Budget } from '../schemas/budget.schema';

@Injectable()
export class BudgetRepository extends BaseRepository<Budget> {
    constructor(
        @InjectRepository(Budget)
        private readonly budgetRepository: Repository<Budget>,
    ) {
        super(budgetRepository);
    }
}