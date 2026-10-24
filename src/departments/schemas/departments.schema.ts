import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/schemas/users.schema';

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    department_id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 100 })
    department_name: string;

    @Column({ type: 'text', nullable: false })
    description: string;

    @Column({ type: 'bigint', nullable: false })
    manager_id: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'manager_id' })
    manager: User;

    @OneToMany(() => User, (user) => user.department)
    users: User[];

    @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}