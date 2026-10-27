import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/data-access';
import { ExpenseCategory } from '../schemas/expense-category.schema';

@Injectable()
export class ExpenseCategoryRepository extends BaseRepository<ExpenseCategory> {
    constructor(
        @InjectRepository(ExpenseCategory)
        private readonly categoryRepository: Repository<ExpenseCategory>,
    ) {
        super(categoryRepository);
    }
}