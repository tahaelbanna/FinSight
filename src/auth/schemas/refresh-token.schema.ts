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

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Index()
    @Column({ type: 'bigint' })
    user_id: string;

    @Column({ type: 'varchar', length: 255 })
    token_hash: string;

    @Column({ type: 'timestamp with time zone' })
    expires_at: Date;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updated_at: Date;
}