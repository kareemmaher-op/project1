import { Repository } from 'typeorm';
import { Patient } from '../entities/Patient';
import { getDatabase } from '../config/database';

export class PatientRepository {
    private async getRepository(): Promise<Repository<Patient>> {
        const db = await getDatabase();
        return db.getRepository(Patient);
    }

    async create(patientData: Partial<Patient>): Promise<Patient> {
        const repository = await this.getRepository();
        const patient = repository.create(patientData);
        return await repository.save(patient);
    }

    async findById(id: number): Promise<Patient | null> {
        const repository = await this.getRepository();
        return await repository.findOne({
            where: { patient_id: id },
            relations: ['user']
        });
    }

    async findByIdentity(
        userId: number,
        firstName: string,
        lastName: string,
        dateOfBirth: Date
    ): Promise<Patient | null> {
        const repository = await this.getRepository();
        return await repository.findOne({
            where: {
                user_id: userId,
                first_name: firstName,
                last_name: lastName,
                date_of_birth: dateOfBirth
            }
        });
    }

    async findByUserId(userId: number): Promise<Patient[]> {
        const repository = await this.getRepository();
        return await repository.find({
            where: { user_id: userId },
            select: ['patient_id', 'first_name', 'last_name', 'is_self']
        });
    }

    async update(id: number, patientData: Partial<Patient>): Promise<Patient | null> {
        const repository = await this.getRepository();
        await repository.update(id, patientData);
        return await this.findById(id);
    }

    
}