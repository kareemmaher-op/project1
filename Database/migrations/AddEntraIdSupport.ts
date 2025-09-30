import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEntraIdSupport1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add entra_oid column as unique identifier for Entra ID users
        await queryRunner.addColumn('users', new TableColumn({
            name: 'entra_oid',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true, // Allow null temporarily during migration
        }));

        // Add account_status column to track user completion state
        await queryRunner.addColumn('users', new TableColumn({
            name: 'account_status',
            type: 'enum',
            enum: ['incomplete', 'complete'],
            default: "'incomplete'",
        }));

        // Add created_at and updated_at columns
        await queryRunner.addColumn('users', new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
        }));

        await queryRunner.addColumn('users', new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
        }));

        // Make phone_number and password_hash nullable since Entra ID users may not have these
        await queryRunner.changeColumn('users', 'phone_number', new TableColumn({
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
        }));

        await queryRunner.changeColumn('users', 'password_hash', new TableColumn({
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
        }));

        // Create unique index on entra_oid
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USER_ENTRA_OID" ON "users" ("entra_oid") WHERE "entra_oid" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop unique index
        await queryRunner.query(`DROP INDEX "IDX_USER_ENTRA_OID"`);

        // Remove added columns
        await queryRunner.dropColumn('users', 'entra_oid');
        await queryRunner.dropColumn('users', 'account_status');
        await queryRunner.dropColumn('users', 'created_at');
        await queryRunner.dropColumn('users', 'updated_at');

        // Revert phone_number and password_hash to non-nullable
        await queryRunner.changeColumn('users', 'phone_number', new TableColumn({
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
        }));

        await queryRunner.changeColumn('users', 'password_hash', new TableColumn({
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
        }));
    }
}