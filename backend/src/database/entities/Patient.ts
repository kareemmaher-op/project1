import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from 'typeorm';
import { User } from './User';
import { Case } from './Case';

@Entity('patients')
export class Patient {
    @PrimaryGeneratedColumn()
    patient_id!: number;

    @Column({ type: 'int' })
    user_id!: number;

    @Column({ type: 'varchar', length: 100 })
    first_name!: string;

    @Column({ type: 'varchar', length: 100 })
    last_name!: string;

    @Column({ type: 'date' })
    date_of_birth!: Date;

    @Column({ type: 'text', nullable: true })
    allergies_medical_history!: string | null;

    @Column({ type: 'boolean', default: false })
    is_self!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    invite_email!: string | null;

    @Column({ type: 'varchar', length: 255 })
    location!: string;

    @Column({ type: 'varchar', length: 20 })
    postal_code!: string;

    @DeleteDateColumn()
    deleted_at?: Date;

    @ManyToOne(() => User, user => user.patients)
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @OneToMany(() => Case, caseEntity => caseEntity.patient)
    cases?: Case[];
}