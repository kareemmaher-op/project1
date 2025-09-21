import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, DeleteDateColumn } from 'typeorm';
import { Patient } from './Patient';
import { Case } from './Case';
import { NotificationPreference } from './NotificationPreference';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    user_id!: number;

    @Column({ type: 'varchar', length: 100 })
    first_name!: string;

    @Column({ type: 'varchar', length: 100 })
    last_name!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 20 })
    phone_number!: string;

    @Column({ type: 'varchar', length: 255 })
    password_hash!: string;

    @DeleteDateColumn()
    deleted_at?: Date;

    @OneToMany(() => Patient, patient => patient.user)
    patients?: Patient[];

    @OneToMany(() => Case, caseEntity => caseEntity.user)
    cases?: Case[];

    @OneToMany(() => NotificationPreference, notificationPreference => notificationPreference.user)
    notificationPreferences?: NotificationPreference[];
}