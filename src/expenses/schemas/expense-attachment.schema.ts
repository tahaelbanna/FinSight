import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Check,
} from 'typeorm';
import { Expense } from './expense.schema';

@Entity('expense_attachments')
@Check(`"file_size_bytes" > 0`)
@Check(`"content_type" IN ('application/pdf', 'image/jpeg', 'image/png')`)
export class ExpenseAttachment {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    attachment_id: string;

    @Column({ type: 'bigint', nullable: false })
    expense_id: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    file_name: string;

    @Column({ type: 'varchar', length: 500, unique: true, nullable: false })
    file_path: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    content_type: string;

    @Column({ type: 'integer', nullable: false })
    file_size_bytes: number;

    @ManyToOne(() => Expense, (expense) => expense.attachments, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'expense_id' })
    expense: Expense;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    uploaded_at: Date;
}