import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Expense } from './expense.schema';

@Entity('expense_categories')
export class ExpenseCategory {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    category_id: string;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
    category_name: string;

    @OneToMany(() => Expense, (expense) => expense.category)
    expenses: Expense[];
}