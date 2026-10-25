import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';
import { Department } from '../../departments/schemas/departments.schema';
import { ProjectStatus } from '../../common/enums';

@Entity('projects')
@Unique(['project_id', 'department_id'])
@Check(`"end_date" >= "start_date"`)
export class Project {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    project_id: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    project_name: string;

    @Column({ type: 'bigint', nullable: false })
    department_id: string;

    @Column({ type: 'date', nullable: false })
    start_date: Date;

    @Column({ type: 'date', nullable: false })
    end_date: Date;

    @Column({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.PLANNED,
        nullable: false,
    })
    status: ProjectStatus;

    @ManyToOne(() => Department, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'department_id' })
    department: Department;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}