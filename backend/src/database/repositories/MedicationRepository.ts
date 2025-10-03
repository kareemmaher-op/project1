import { Repository } from 'typeorm';
import { Medication } from '../entities/Medication';
import { getDatabase } from '../config/database';
import { ErrorHandler } from '../../utils/errorHandler';

export class MedicationRepository {
    private async getRepository(): Promise<Repository<Medication>> {
        const db = await getDatabase();
        return db.getRepository(Medication);
    }

    async create(medicationData: Partial<Medication>): Promise<Medication> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const medication = repository.create(medicationData);
            return await repository.save(medication);
        }, 'create');
    }

    async findByCaseAndSprayNumber(caseId: number, sprayNumber: number): Promise<Medication | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: { case_id: caseId, spray_number: sprayNumber }
            });
        }, 'findByCaseAndSprayNumber');
    }

    async update(id: number, medicationData: Partial<Medication>): Promise<Medication | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { spray_id: id } });
            ErrorHandler.ensureFound(existing, 'Medication');

            await repository.update(id, medicationData);
            return await repository.findOne({ where: { spray_id: id } });
        }, 'update');
    }

    async updateStatus(medicationId: number, status: string): Promise<Medication> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { spray_id: medicationId } });
            ErrorHandler.ensureFound(existing, 'Medication');

            await repository.update(medicationId, { status });
            const updatedMedication = await repository.findOne({ where: { spray_id: medicationId } });
            return ErrorHandler.ensureFound(updatedMedication, 'Medication');
        }, 'updateStatus');
    }

    async delete(id: number): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { spray_id: id } });
            ErrorHandler.ensureFound(existing, 'Medication');

            const result = await repository.softDelete(id);
            return result.affected !== undefined && result.affected > 0;
        }, 'delete');
    }

    async findByCaseId(caseId: number): Promise<Medication[]> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.find({
                where: { case_id: caseId },
                order: { spray_number: 'ASC' }
            });
        }, 'findByCaseId');
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ medications: Medication[], total: number }> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const [medications, total] = await repository.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                relations: ['case'],
                order: { spray_id: 'DESC' }
            });
            return { medications, total };
        }, 'findAll');
    }
}