import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';

@Entity('system_admins')
export class SystemAdmin {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    admin_id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password_hash: string;

    @Column({ type: 'boolean', default: false })
    is_super_admin: boolean;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at: Date;

    @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
    deleted_at: Date | null;
}