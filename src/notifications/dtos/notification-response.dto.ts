import { Expose } from 'class-transformer';
import { NotificationType, ExpenseStatus } from 'src/common/enums';

export class NotificationResponseDto {
    @Expose() 
    notification_id: string;
    
    @Expose() 
    type: NotificationType;
    
    @Expose() 
    title: string;
    
    @Expose() 
    body: string;
    
    @Expose() 
    expense_id: string;
    
    @Expose() 
    expenseStatus: ExpenseStatus; 
    
    @Expose() 
    is_read: boolean;
    
    @Expose() 
    created_at: Date;
}