import { Expose } from 'class-transformer';

export class CategoryBreakdownResponseDto {
    @Expose() 
    category_id: string;
    
    @Expose() 
    category_name: string;
    
    @Expose() 
    total: number;
}