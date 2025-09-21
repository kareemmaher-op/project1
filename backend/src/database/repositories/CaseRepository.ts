import { Repository } from 'typeorm';
import { Case } from '../entities/Case';
import { getDatabase } from '../config/database';

export class CaseRepository {
    private async getRepository(): Promise<Repository<Case>> {
        const db = await getDatabase();
        return db.getRepository(Case);
    }

    async create(caseData: Partial<Case>): Promise<Case> {
        const repository = await this.getRepository();
        const caseEntity = repository.create(caseData);
        return await repository.save(caseEntity);
    }

    async findByNumericId(id: number): Promise<Case | null> {
        const repository = await this.getRepository();
        return await repository.findOne({
            where: { id: id },
            relations: ['patient']
        });
    }

    

    async update(caseCode: string, caseData: Partial<Case>): Promise<Case | null> {
        const repository = await this.getRepository();
        await repository.update({ case_id: caseCode }, caseData);
        return await this.findByCaseCode(caseCode);
    }

    

    

    async findByCaseCode(caseCode: string): Promise<Case | null> {
        const repository = await this.getRepository();
        return await repository.findOne({
            where: { case_id: caseCode },
            relations: ['patient', 'medications']
        });
    }

    async updatePatientAssociation(caseId: number, patientId: number): Promise<Case | null> {
        const repository = await this.getRepository();
        await repository.update(caseId, { patient_id: patientId });
        return await repository.findOne({ where: { id: caseId } });
    }
}