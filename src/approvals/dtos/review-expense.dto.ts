import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ExpenseStatus } from 'src/common/enums';

export class ReviewExpenseDto {
    @IsNotEmpty()
    @IsEnum(ExpenseStatus, {
        message: 'Decision must be either approved or rejected',
    })
    decision: ExpenseStatus;

    @ValidateIf((o) => o.decision === ExpenseStatus.REJECTED)
    @IsNotEmpty({ message: 'Comment is required when rejecting an expense' })
    @IsString()
    comment?: string;
}