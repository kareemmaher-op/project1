import { Repository } from 'typeorm';
import { Patient } from '../entities/Patient';
import { getDatabase } from '../config/database';
import { ErrorHandler } from '../../utils/errorHandler';

export class PatientRepository {
    private async getRepository(): Promise<Repository<Patient>> {
        const db = await getDatabase();
        return db.getRepository(Patient);
    }

    async create(patientData: Partial<Patient>): Promise<Patient> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const patient = repository.create(patientData);
            return await repository.save(patient);
        }, 'create');
    }

    async findById(id: number): Promise<Patient | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: { patient_id: id },
                relations: ['user']
            });
        }, 'findById');
    }

    async findByIdentity(
        userId: number,
        firstName: string,
        lastName: string,
        dateOfBirth: Date
    ): Promise<Patient | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: {
                    user_id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    date_of_birth: dateOfBirth
                }
            });
        }, 'findByIdentity');
    }

    async findByUserId(userId: number): Promise<Patient[]> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.find({
                where: { user_id: userId },
                select: ['patient_id', 'first_name', 'last_name', 'is_self']
            });
        }, 'findByUserId');
    }

    async update(id: number, patientData: Partial<Patient>): Promise<Patient | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { patient_id: id } });
            ErrorHandler.ensureFound(existing, 'Patient');

            await repository.update(id, patientData);
            return await this.findById(id);
        }, 'update');
    }

    async delete(id: number): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { patient_id: id } });
            ErrorHandler.ensureFound(existing, 'Patient');

            const result = await repository.softDelete(id);
            return result.affected !== undefined && result.affected > 0;
        }, 'delete');
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ patients: Patient[], total: number }> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const [patients, total] = await repository.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                relations: ['user']
            });
            return { patients, total };
        }, 'findAll');
    }
}