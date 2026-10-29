import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ActionType, EntityType } from '../../common/enums';

export class GetActivityLogsDto extends PaginationDto {
    @IsOptional() 
    @IsString() 
    user_id?: string;
    
    @IsOptional() 
    @IsEnum(ActionType) 
    action_type?: ActionType;
    
    @IsOptional() 
    @IsEnum(EntityType) 
    entity_type?: EntityType;
    
    @IsOptional() 
    @IsString() 
    entity_id?: string;
    
    @IsOptional() 
    @IsDateString() 
    date_from?: string;
    
    @IsOptional() 
    @IsDateString() 
    date_to?: string;
}
