import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/data-access';
import { Expense } from '../schemas/expense.schema';

@Injectable()
export class ExpenseRepository extends BaseRepository<Expense> {
    constructor(
        @InjectRepository(Expense)
        private readonly expenseRepository: Repository<Expense>,
    ) {
        super(expenseRepository);
    }

    // TODO:
    // مثل: جلب إجمالي المصروفات المعتمدة (Approved) خلال فترة ميزانية معينة
    // لحل مشكلة الـ (Calculated Values) اللي اتكلمنا عليها في موديول الميزانيات.
}