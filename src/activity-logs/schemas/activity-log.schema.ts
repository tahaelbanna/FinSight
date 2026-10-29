import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from 'src/users/schemas/users.schema';
import { ActionType, EntityType } from 'src/common/enums';

@Entity('activity_logs')
export class ActivityLog {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    log_id: string;

    @Column({ type: 'bigint', nullable: false })
    user_id: string;

    @Column({ type: 'enum', enum: ActionType, nullable: false })
    action_type: ActionType;

    @Column({ type: 'enum', enum: EntityType, nullable: false })
    entity_type: EntityType;

    @Column({ type: 'bigint', nullable: false })
    entity_id: string;

    @CreateDateColumn({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    })
    created_at: Date;

    @ManyToOne(() => User, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
