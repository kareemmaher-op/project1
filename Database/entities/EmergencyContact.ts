import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Case } from './Case';

@Entity('emergency_contacts')
export class EmergencyContact {
    @PrimaryGeneratedColumn()
    contact_id!: number;

    @Column({ type: 'int' })
    case_id!: number;

    @Column({ type: 'varchar', length: 50 })
    first_name!: string;

    @Column({ type: 'varchar', length: 50 })
    last_name!: string;

    @Column({ type: 'varchar', length: 255 })
    email!: string;

    @Column({ type: 'varchar', length: 20 })
    phone_number!: string;

    @Column({ type: 'boolean', default: false })
    invite_sent!: boolean;

    @DeleteDateColumn()
    deleted_at?: Date;

    @ManyToOne(() => Case)
    @JoinColumn({ name: 'case_id', referencedColumnName: 'id' })
    case?: Case;
}
