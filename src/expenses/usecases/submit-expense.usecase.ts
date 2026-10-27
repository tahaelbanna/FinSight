import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException } from 'src/common/error-handling/custom-exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/error-handling/custom-exceptions/not-found.exception';
import { MulterFile } from 'src/files-upload/types/file-type.types';
import { FilesUploadService } from 'src/files-upload/files-upload.service';

import { ExpenseRepository } from '../repositories/expense.repository';
import { ExpenseAttachmentRepository } from '../repositories/expense-attachment.repository';
import { ExpenseCategoryRepository } from '../repositories/expense-category.repository';
import { DepartmentRepository } from 'src/departments/repositories/department.repository';
import { ProjectRepository } from 'src/projects/repositories/project.repository';
import { UserRepository } from 'src/users/repositories/users.repository';

import { CreateExpenseDto } from '../dtos/create-expense.dto';
import { ExpenseResponseDto } from '../dtos/expense-response.dto';
import { ExpenseStatus } from 'src/common/enums';

@Injectable()
export class SubmitExpenseUseCase {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly attachmentRepository: ExpenseAttachmentRepository,
        private readonly categoryRepository: ExpenseCategoryRepository,
        private readonly departmentRepository: DepartmentRepository,
        private readonly projectRepository: ProjectRepository,
        private readonly userRepository: UserRepository,
        private readonly filesUploadService: FilesUploadService,
        private readonly i18nService: I18nService,
    ) {}

    async execute(
        body: CreateExpenseDto,
        receipts: MulterFile[],
        user_id: string,
    ): Promise<ExpenseResponseDto> {
        const department = await this.departmentRepository.findById(
            body.department_id,
        );
        if (!department) {
            throw new NotFoundException(
                this.i18nService.translate('departments.DEPARTMENT_NOT_FOUND'),
            );
        }

        let project = null;
        if (body.project_id) {
            project = await this.projectRepository.findById(body.project_id);
            if (!project) {
                throw new NotFoundException(
                    this.i18nService.translate('projects.PROJECT_NOT_FOUND'),
                );
            }
            if (project.department_id !== department.department_id) {
                throw new BadRequestException(
                    this.i18nService.translate(
                        'projects.FORBIDDEN_DEPARTMENT_ACCESS',
                    ),
                );
            }
        }

        const category = await this.categoryRepository.findById(
            body.category_id,
        );
        if (!category) {
            throw new NotFoundException(
                this.i18nService.translate('categories.CATEGORY_NOT_FOUND'),
            );
        }

        const submitter = await this.userRepository.findById(user_id);
        if (!submitter) {
            throw new NotFoundException(
                this.i18nService.translate('users.USER_NOT_FOUND'),
            );
        }

        let uploadedUrls: string[] = [];
        if (receipts && receipts.length > 0) {
            uploadedUrls =
                await this.filesUploadService.uploadMultipleFiles(receipts);
        }

        const newExpense = await this.expenseRepository.create({
            user_id: user_id,
            department_id: body.department_id,
            project_id: body.project_id,
            category_id: body.category_id,
            amount: body.amount,
            description: body.description,
            expense_date: new Date(body.expense_date),
            status: ExpenseStatus.PENDING,
        });

        const attachmentsData = [];
        if (receipts && receipts.length > 0) {
            const attachmentEntities = receipts.map((file, index) => ({
                expense_id: newExpense.expense_id,
                file_name: file.originalname ?? 'receipt',
                file_path: uploadedUrls[index],
                content_type: file.mimetype,
                file_size_bytes: file.size,
            }));
            const savedAttachments =
                await this.attachmentRepository.createMany(attachmentEntities);
            attachmentsData.push(...savedAttachments);
        }

        // TODO: Activity Log (EXPENSE_SUBMITTED)

        const responseData = {
            expense_id: newExpense.expense_id,
            submitted_by: {
                user_id: submitter.user_id,
                full_name: submitter.full_name,
            },
            department: {
                department_id: department.department_id,
                department_name: department.department_name,
            },
            project: project
                ? {
                    project_id: project.project_id,
                    project_name: project.project_name,
                }
                : null,
            amount: Number(newExpense.amount),
            category: {
                category_id: category.category_id,
                category_name: category.category_name,
            },
            description: newExpense.description,
            expense_date: newExpense.expense_date,
            status: newExpense.status,
            attachments: attachmentsData.map((att) => ({
                attachment_id: att.attachment_id,
                file_name: att.file_name,
                file_path: att.file_path,
            })),
            submitted_at: newExpense.submitted_at,
        };

        return plainToInstance(ExpenseResponseDto, responseData, {
            excludeExtraneousValues: true,
        });
    }
}
