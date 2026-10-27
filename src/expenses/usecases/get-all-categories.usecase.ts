import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ExpenseCategoryRepository } from '../repositories/expense-category.repository';
import { CategoryResponseDto } from '../dtos/category-response.dto';

@Injectable()
export class GetAllCategoriesUseCase {
    constructor(private readonly categoryRepository: ExpenseCategoryRepository) {}

    async execute(): Promise<CategoryResponseDto[]> {
        const categories = await this.categoryRepository.find({
            order: { category_name: 'ASC' },
        });

        return plainToInstance(CategoryResponseDto, categories, {
            excludeExtraneousValues: true,
        });
    }
}