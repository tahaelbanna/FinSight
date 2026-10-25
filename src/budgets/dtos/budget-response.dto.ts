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

    // --- Calculated Fields ---
    // @Expose()
    // approved_expenses: number;

    // @Expose()
    // remaining_budget: number;

    // @Expose()
    // utilization_percentage: number;

    // @Expose()
    // budget_variance: number;

    // @Expose()
    // utilization_level: string; // 'low', 'moderate', 'high', 'over'

    // @Expose()
    // is_overrun: boolean;

    // TODO: 
    // @Expose()
    // @Type(() => ExpenseDto) 
    // recent_expenses: ExpenseDto[];

    @Expose()
    @Type(() => UserDto)
    created_by: UserDto;
}