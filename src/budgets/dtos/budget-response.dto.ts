import { Expose, Type } from 'class-transformer';

class BudgetScopeDto {
    @Expose()
    id: string;

    @Expose()
    name: string;
}

class UserDto {
    @Expose()
    user_id: string;

    @Expose()
    full_name: string;
}

class CategoryDto {
    @Expose()
    category_id: string;

    @Expose()
    category_name: string;
}

export class BudgetResponseDto {
    @Expose()
    budget_id: string;

    @Expose()
    @Type(() => BudgetScopeDto)
    department?: BudgetScopeDto;

    @Expose()
    @Type(() => BudgetScopeDto)
    project?: BudgetScopeDto;

    @Expose()
    allocated_amount: number;

    @Expose()
    start_date: Date;

    @Expose()
    end_date: Date;

    @Expose()
    approved_expenses: number;

    @Expose()
    remaining_budget: number;

    @Expose()
    utilization_percentage: number;

    @Expose()
    budget_variance: number;

    @Expose()
    utilization_level: string;

    @Expose()
    is_overrun: boolean;

    @Expose()
    @Type(() => MinimalExpenseDto)
    recent_expenses: MinimalExpenseDto[];

    @Expose()
    @Type(() => UserDto)
    created_by: UserDto;
}

class MinimalExpenseDto {
    @Expose()
    expense_id: string;

    @Expose()
    amount: number;

    @Expose()
    expense_date: Date;

    @Expose()
    status: string;

    @Expose()
    @Type(() => CategoryDto)
    category: CategoryDto;
}
