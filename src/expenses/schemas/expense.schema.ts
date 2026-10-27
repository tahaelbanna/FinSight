import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Check,
} from 'typeorm';
import { User } from '../../users/schemas/users.schema';
import { Department } from '../../departments/schemas/departments.schema';
import { Project } from '../../projects/schemas/project.schema';
import { ExpenseCategory } from './expense-category.schema';
import { ExpenseAttachment } from './expense-attachment.schema';
import { ExpenseStatus } from '../../common/enums';

@Entity('expenses')
@Check(`"amount" > 0`)
@Check(`TRIM("description") <> ''`)
@Check(`
    ("status" = 'pending' AND "reviewer_id" IS NULL AND "reviewed_at" IS NULL AND "review_comment" IS NULL)
    OR
    ("status" = 'approved' AND "reviewer_id" IS NOT NULL AND "reviewed_at" IS NOT NULL)
    OR
    ("status" = 'rejected' AND "reviewer_id" IS NOT NULL AND "reviewed_at" IS NOT NULL AND "review_comment" IS NOT NULL)
`)
export class Expense {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    expense_id: string;

    @Column({ type: 'bigint', nullable: false })
    user_id: string;

    @Column({ type: 'bigint', nullable: false })
    department_id: string;

    @Column({ type: 'bigint', nullable: true })
    project_id?: string;

    @Column({ type: 'bigint', nullable: false })
    category_id: string;

    @Column({ type: 'numeric', precision: 14, scale: 2, nullable: false })
    amount: number;

    @Column({ type: 'text', nullable: false })
    description: string;

    @Column({ type: 'date', nullable: false })
    expense_date: Date;

    @Column({
        type: 'enum',
        enum: ExpenseStatus,
        default: ExpenseStatus.PENDING,
        nullable: false,
    })
    status: ExpenseStatus;

    @Column({ type: 'bigint', nullable: true })
    reviewer_id?: string;

    @Column({ type: 'text', nullable: true })
    review_comment?: string;

    @CreateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    })
    submitted_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    reviewed_at?: Date;



    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Department, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'department_id' })
    department: Department;

    @ManyToOne(() => Project, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => ExpenseCategory, (category) => category.expenses, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'category_id' })
    category: ExpenseCategory;

    @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'reviewer_id' })
    reviewer: User;

    @OneToMany(() => ExpenseAttachment, (attachment) => attachment.expense)
    attachments: ExpenseAttachment[];
}
