import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from 'src/users/schemas/users.schema';
import { Expense } from 'src/expenses/schemas/expense.schema';
import { NotificationType } from 'src/common/enums';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    notification_id: string;

    @Column({ type: 'bigint', nullable: false })
    user_id: string;

    @Column({ type: 'enum', enum: NotificationType, nullable: false })
    type: NotificationType;

    @Column({ type: 'bigint', nullable: false })
    expense_id: string;

    @Column({ type: 'varchar', length: 200, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false })
    body: string;

    @Column({ type: 'boolean', default: false })
    is_read: boolean;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    read_at?: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Expense, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'expense_id' })
    expense: Expense;
}