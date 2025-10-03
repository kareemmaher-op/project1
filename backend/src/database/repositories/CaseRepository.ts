import { Repository } from 'typeorm';
import { Case } from '../entities/Case';
import { getDatabase } from '../config/database';
import { ErrorHandler } from '../../utils/errorHandler';

export class CaseRepository {
    private async getRepository(): Promise<Repository<Case>> {
        const db = await getDatabase();
        return db.getRepository(Case);
    }

    async create(caseData: Partial<Case>): Promise<Case> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const caseEntity = repository.create(caseData);
            return await repository.save(caseEntity);
        }, 'create');
    }

    async findByNumericId(id: number): Promise<Case | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: { id: id },
                relations: ['patient']
            });
        }, 'findByNumericId');
    }

    

    async update(caseCode: string, caseData: Partial<Case>): Promise<Case | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { case_id: caseCode } });
            ErrorHandler.ensureFound(existing, 'Case');

            await repository.update({ case_id: caseCode }, caseData);
            return await this.findByCaseCode(caseCode);
        }, 'update');
    }

    

    

    async findByCaseCode(caseCode: string): Promise<Case | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: { case_id: caseCode },
                relations: ['patient', 'medications']
            });
        }, 'findByCaseCode');
    }

    async updatePatientAssociation(caseId: number, patientId: number): Promise<Case | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { id: caseId } });
            ErrorHandler.ensureFound(existing, 'Case');

            await repository.update(caseId, { patient_id: patientId });
            return await repository.findOne({ where: { id: caseId } });
        }, 'updatePatientAssociation');
    }

    async findByUserId(userId: number): Promise<Case[]> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.find({
                where: { user_id: userId },
                relations: ['patient', 'medications'],
                order: { id: 'DESC' }
            });
        }, 'findByUserId');
    }

    async delete(id: number): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { id: id } });
            ErrorHandler.ensureFound(existing, 'Case');

            const result = await repository.softDelete(id);
            return result.affected !== undefined && result.affected > 0;
        }, 'delete');
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ cases: Case[], total: number }> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const [cases, total] = await repository.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                relations: ['patient', 'medications'],
                order: { id: 'DESC' }
            });
            return { cases, total };
        }, 'findAll');
    }
}