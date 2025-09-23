import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAlertScheduleColumn1758452416781 implements MigrationInterface {
    name = 'RemoveAlertScheduleColumn1758452416781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP COLUMN "alert_schedule"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD "alert_schedule" character varying(255)`);
    }
}