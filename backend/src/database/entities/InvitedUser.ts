import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Case } from './Case';
import { User } from './User';

@Entity('invited_users')
export class InvitedUser {
    @PrimaryGeneratedColumn()
    invited_user_id!: number;

    @Column({ type: 'int' })
    case_id!: number;

    @Column({ type: 'int', nullable: true })
    user_id!: number | null;

    @Column({ type: 'varchar', length: 255 })
    email!: string; // stores invite email

    @DeleteDateColumn()
    deleted_at?: Date;

    @ManyToOne(() => Case)
    @JoinColumn({ name: 'case_id', referencedColumnName: 'id' })
    case?: Case;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
    user?: User | null;
}

