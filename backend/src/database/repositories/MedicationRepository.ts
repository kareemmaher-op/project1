import { Repository } from 'typeorm';
import { Medication } from '../entities/Medication';
import { getDatabase } from '../config/database';

export class MedicationRepository {
    private async getRepository(): Promise<Repository<Medication>> {
        const db = await getDatabase();
        return db.getRepository(Medication);
    }

    async create(medicationData: Partial<Medication>): Promise<Medication> {
        const repository = await this.getRepository();
        const medication = repository.create(medicationData);
        return await repository.save(medication);
    }

    async findByCaseAndSprayNumber(caseId: number, sprayNumber: number): Promise<Medication | null> {
        const repository = await this.getRepository();
        return await repository.findOne({
            where: { case_id: caseId, spray_number: sprayNumber }
        });
    }

    async update(id: number, medicationData: Partial<Medication>): Promise<Medication | null> {
        const repository = await this.getRepository();
        await repository.update(id, medicationData);
        return await repository.findOne({ where: { spray_id: id } });
    }

    async updateStatus(medicationId: number, status: string): Promise<Medication> {
        const repository = await this.getRepository();
        await repository.update(medicationId, { status });
        const updatedMedication = await repository.findOne({ where: { spray_id: medicationId } });
        if (!updatedMedication) {
            throw new Error('Medication not found after update');
        }
        return updatedMedication;
    }
}