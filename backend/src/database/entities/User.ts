import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from './Patient';
import { Case } from './Case';
import { NotificationPreference } from './NotificationPreference';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    user_id!: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    entra_oid?: string;

    @Column({ type: 'varchar', length: 100 })
    first_name!: string;

    @Column({ type: 'varchar', length: 100 })
    last_name!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone_number?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    password_hash?: string;

    @Column({ type: 'varchar', length: 20, default: 'incomplete', nullable: true })
    account_status?: 'incomplete' | 'complete';

    @Column({ type: 'boolean', default: false, nullable: true })
    first_login_completed?: boolean;

    @DeleteDateColumn()
    deleted_at?: Date;

    @OneToMany(() => Patient, patient => patient.user)
    patients?: Patient[];

    @OneToMany(() => Case, caseEntity => caseEntity.user)
    cases?: Case[];

    @OneToMany(() => NotificationPreference, notificationPreference => notificationPreference.user)
    notificationPreferences?: NotificationPreference[];
}