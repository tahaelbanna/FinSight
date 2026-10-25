import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateProjectDto {
    @IsNotEmpty()
    @IsString()
    project_name: string;
    
    @IsNotEmpty()
    @IsString()
    department_id: string;
    
    @IsNotEmpty()
    @IsDateString()
    start_date: string;
    
    @IsNotEmpty()
    @IsDateString()
    end_date: string;
}