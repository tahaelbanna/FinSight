import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { UserRole } from '../../common/enums';
import { Department } from '../../departments/schemas/departments.schema';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    user_id: string; 

    @Column({ type: 'varchar', length: 150 })
    full_name: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password_hash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.EMPLOYEE,
    })
    role: UserRole;

    @Column({ type: 'bigint', nullable: true })
    department_id: string | null;

    @ManyToOne(() => Department, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'department_id' })
    department?: Department;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}