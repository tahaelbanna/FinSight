import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Check,
} from 'typeorm';
import { Department } from '../../departments/schemas/departments.schema';
import { Project } from '../../projects/schemas/project.schema';
import { User } from '../../users/schemas/users.schema';

@Entity('budgets')
@Check(`("department_id" IS NOT NULL AND "project_id" IS NULL) OR ("department_id" IS NULL AND "project_id" IS NOT NULL)`)
@Check(`"end_date" > "start_date"`)
@Check(`"allocated_amount" > 0`)
export class Budget {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    budget_id: string;

    @Column({ type: 'bigint', nullable: true })
    department_id?: string;

    @Column({ type: 'bigint', nullable: true })
    project_id?: string;

    @Column({ type: 'numeric', precision: 14, scale: 2, nullable: false })
    allocated_amount: number;

    @Column({ type: 'date', nullable: false })
    start_date: Date;

    @Column({ type: 'date', nullable: false })
    end_date: Date;

    @Column({ type: 'bigint', nullable: false })
    created_by: string;

    @ManyToOne(() => Department, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'department_id' })
    department: Department;

    @ManyToOne(() => Project, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}