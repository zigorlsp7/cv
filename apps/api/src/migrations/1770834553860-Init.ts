import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1770834553860 implements MigrationInterface {
  name = 'Init1770834553860';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dummy" ("id" SERIAL NOT NULL, CONSTRAINT "PK_8a7fd4e47344e8cfa61be2098af" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "dummy"`);
  }
}
