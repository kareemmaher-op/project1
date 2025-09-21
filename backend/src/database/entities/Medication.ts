import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check, DeleteDateColumn } from 'typeorm';
import { Case } from './Case';

@Entity('medications')
@Check('CHK_medications_spray_number', '"spray_number" IN (1,2)')
export class Medication {
    @PrimaryGeneratedColumn()
    spray_id!: number;

    @Column({ type: 'int' })
    case_id!: number;

    @Column({ type: 'int' })
    spray_number!: number;

    @Column({
        type: 'varchar',
        length: 50,
        default: 'pending'
    })
    status!: string;

    @Column({ type: 'date' })
    expiration_date_spray_1!: Date;

    @Column({ type: 'date' })
    expiration_date_spray_2!: Date;

    @Column({ type: 'varchar', length: 500, nullable: true })
    dosage_details!: string | null;

    @DeleteDateColumn()
    deleted_at?: Date;

    @ManyToOne(() => Case, caseEntity => caseEntity.medications)
    @JoinColumn({ name: 'case_id', referencedColumnName: 'id' })
    case?: Case;

    // Patient accessible through: medication.case.patient
}