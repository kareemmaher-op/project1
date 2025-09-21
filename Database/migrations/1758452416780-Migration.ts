import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1758452416780 implements MigrationInterface {
    name = 'Migration1758452416780'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "medications" ("spray_id" SERIAL NOT NULL, "case_id" integer NOT NULL, "spray_number" integer NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'pending', "expiration_date_spray_1" date NOT NULL, "expiration_date_spray_2" date NOT NULL, "dosage_details" character varying(500), "deleted_at" TIMESTAMP, CONSTRAINT "CHK_medications_spray_number" CHECK ("spray_number" IN (1,2)), CONSTRAINT "PK_3b2e8ebbf2b5727b31cf5e4dce3" PRIMARY KEY ("spray_id"))`);
        await queryRunner.query(`CREATE TABLE "notification_preferences" ("notification_pref_id" SERIAL NOT NULL, "case_id" integer, "user_id" integer, "type" character varying(100) NOT NULL, "delivery_method" character varying(100), "enabled" boolean NOT NULL DEFAULT true, "alert_schedule" character varying(255), "deleted_at" TIMESTAMP, CONSTRAINT "PK_680609a377d0507232b9e66d108" PRIMARY KEY ("notification_pref_id"))`);
        await queryRunner.query(`CREATE TABLE "cases" ("id" SERIAL NOT NULL, "case_id" character varying(255) NOT NULL, "patient_id" integer, "user_id" integer, "case_name" character varying(255) NOT NULL, "current_step" character varying(50) DEFAULT 'CREATED', "battery_level" integer, "last_seen" TIMESTAMP, "connection_status" character varying(50) DEFAULT 'disconnected', "deleted_at" TIMESTAMP, CONSTRAINT "UQ_b8dcf802997909e8a6c413bf8d6" UNIQUE ("case_id"), CONSTRAINT "PK_264acb3048c240fb89aa34626db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patients" ("patient_id" SERIAL NOT NULL, "user_id" integer NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "date_of_birth" date NOT NULL, "allergies_medical_history" text, "is_self" boolean NOT NULL DEFAULT false, "invite_email" character varying(255), "location" character varying(255) NOT NULL, "postal_code" character varying(20) NOT NULL, "deleted_at" TIMESTAMP, CONSTRAINT "PK_1dc2db3a63a0bf2388fbfee86b1" PRIMARY KEY ("patient_id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("user_id" SERIAL NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "phone_number" character varying(20) NOT NULL, "password_hash" character varying(255) NOT NULL, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "emergency_contacts" ("contact_id" SERIAL NOT NULL, "case_id" integer NOT NULL, "first_name" character varying(50) NOT NULL, "last_name" character varying(50) NOT NULL, "email" character varying(255) NOT NULL, "phone_number" character varying(20) NOT NULL, "invite_sent" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, CONSTRAINT "PK_bb49237451a0b688b99d2872de8" PRIMARY KEY ("contact_id"))`);
        await queryRunner.query(`CREATE TABLE "invited_users" ("invited_user_id" SERIAL NOT NULL, "case_id" integer NOT NULL, "user_id" integer, "email" character varying(255) NOT NULL, "deleted_at" TIMESTAMP, CONSTRAINT "PK_33c2423e9dbf723b8be1a0d4a02" PRIMARY KEY ("invited_user_id"))`);
        await queryRunner.query(`ALTER TABLE "medications" ADD CONSTRAINT "FK_d093f410ffaa057ebc834531d48" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_64c90edc7310c6be7c10c96f675" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_692f54b5bff06106f0679102f3a" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cases" ADD CONSTRAINT "FK_8c29bbd52f57311cd8c1f832076" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cases" ADD CONSTRAINT "FK_050257d1dfa826275982b85af92" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "FK_7fe1518dc780fd777669b5cb7a0" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "emergency_contacts" ADD CONSTRAINT "FK_a261edfd760caea56bf6821670b" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invited_users" ADD CONSTRAINT "FK_973169ffb1aff78b32fa6870097" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invited_users" ADD CONSTRAINT "FK_f3095c2076a1d79e4cbe889e665" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invited_users" DROP CONSTRAINT "FK_f3095c2076a1d79e4cbe889e665"`);
        await queryRunner.query(`ALTER TABLE "invited_users" DROP CONSTRAINT "FK_973169ffb1aff78b32fa6870097"`);
        await queryRunner.query(`ALTER TABLE "emergency_contacts" DROP CONSTRAINT "FK_a261edfd760caea56bf6821670b"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "FK_7fe1518dc780fd777669b5cb7a0"`);
        await queryRunner.query(`ALTER TABLE "cases" DROP CONSTRAINT "FK_050257d1dfa826275982b85af92"`);
        await queryRunner.query(`ALTER TABLE "cases" DROP CONSTRAINT "FK_8c29bbd52f57311cd8c1f832076"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_692f54b5bff06106f0679102f3a"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_64c90edc7310c6be7c10c96f675"`);
        await queryRunner.query(`ALTER TABLE "medications" DROP CONSTRAINT "FK_d093f410ffaa057ebc834531d48"`);
        await queryRunner.query(`DROP TABLE "invited_users"`);
        await queryRunner.query(`DROP TABLE "emergency_contacts"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "patients"`);
        await queryRunner.query(`DROP TABLE "cases"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TABLE "medications"`);
    }

}
