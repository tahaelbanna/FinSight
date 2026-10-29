import { Expose, Type } from 'class-transformer';
import { ActionType, EntityType } from 'src/common/enums';

class UserSnippet {
    @Expose() user_id: string;
    @Expose() full_name: string;
}

export class ActivityLogResponseDto {
    @Expose() 
    log_id: string;
    
    @Expose() 
    @Type(() => UserSnippet) 
    user: UserSnippet;
    
    @Expose() 
    action_type: ActionType;
    
    @Expose() 
    entity_type: EntityType;
    
    @Expose() 
    entity_id: string;
    
    @Expose() 
    created_at: Date;
}
