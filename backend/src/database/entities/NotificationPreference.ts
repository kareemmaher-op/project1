import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { User } from './User';
import { Case } from './Case';

@Entity('notification_preferences')
export class NotificationPreference {
    @PrimaryGeneratedColumn()
    notification_pref_id!: number;

    @Column({ type: 'int', nullable: true })
    case_id!: number | null;

    @Column({ type: 'int', nullable: true })
    user_id!: number | null;

    @Column({ type: 'varchar', length: 100 })
    type!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    delivery_method!: string | null;

    @Column({ type: 'boolean', default: true })
    enabled!: boolean;

    @DeleteDateColumn()
    deleted_at?: Date;

    @ManyToOne(() => User, user => user.notificationPreferences, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @ManyToOne(() => Case, caseEntity => caseEntity.notificationPreferences, { nullable: true })
    @JoinColumn({ name: 'case_id' })
    case?: Case;
}