import { Expose, Type } from 'class-transformer';
import { ExpenseStatus } from 'src/common/enums';

class MinimalUserDto {
    @Expose() user_id: string;
    @Expose() full_name: string;
}

class MinimalDepartmentDto {
    @Expose() department_id: string;
    @Expose() department_name: string;
}

class MinimalProjectDto {
    @Expose() project_id: string;
    @Expose() project_name: string;
}

class CategoryDto {
    @Expose() category_id: string;
    @Expose() category_name: string;
}

class AttachmentDto {
    @Expose() attachment_id: string;
    @Expose() file_name: string;
    @Expose() file_path: string;
}

export class ExpenseResponseDto {
    @Expose() expense_id: string;

    @Expose()
    @Type(() => MinimalUserDto)
    submitted_by: MinimalUserDto;

    @Expose()
    @Type(() => MinimalDepartmentDto)
    department: MinimalDepartmentDto;

    @Expose()
    @Type(() => MinimalProjectDto)
    project?: MinimalProjectDto;

    @Expose() amount: number;

    @Expose()
    @Type(() => CategoryDto)
    category: CategoryDto;

    @Expose() description: string;
    @Expose() expense_date: Date;
    @Expose() status: ExpenseStatus;

    @Expose()
    @Type(() => MinimalUserDto)
    reviewer?: MinimalUserDto;

    @Expose() review_comment?: string;
    @Expose() reviewed_at?: Date;

    @Expose()
    @Type(() => AttachmentDto)
    attachments: AttachmentDto[];

    @Expose() submitted_at: Date;
}
