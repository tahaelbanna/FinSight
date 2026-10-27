import { Expose } from 'class-transformer';

export class CategoryResponseDto {
    @Expose()
    category_id: string;

    @Expose()
    category_name: string;
}