import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Patient } from './Patient';
import { Medication } from './Medication';
import { User } from './User';
import { NotificationPreference } from './NotificationPreference';

@Entity('cases')
export class Case {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    case_id!: string;

    @Column({ type: 'int', nullable: true })
    patient_id!: number | null;

    @Column({ type: 'int', nullable: true })
    user_id!: number | null;

    @Column({ type: 'varchar', length: 255 })
    case_name!: string;

    @Column({ type: 'varchar', length: 50, nullable: true, default: 'CREATED' })
    current_step!: string | null;

    @Column({ type: 'int', nullable: true })
    battery_level!: number | null;

    @Column({ type: 'timestamp', nullable: true })
    last_seen!: Date | null;

    @Column({ 
        type: 'varchar',
        length: 50,
        nullable: true,
        default: 'disconnected'
    })
    connection_status!: string | null;

    @DeleteDateColumn()
    deleted_at?: Date;

    @ManyToOne(() => Patient, patient => patient.cases, { nullable: true })
    @JoinColumn({ name: 'patient_id' })
    patient?: Patient;

    @ManyToOne(() => User, user => user.cases, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @OneToMany(() => Medication, medication => medication.case)
    medications?: Medication[];

    @OneToMany(() => NotificationPreference, notificationPreference => notificationPreference.case)
    notificationPreferences?: NotificationPreference[];
}