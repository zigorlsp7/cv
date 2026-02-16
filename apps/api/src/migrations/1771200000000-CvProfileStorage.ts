import { MigrationInterface, QueryRunner } from 'typeorm';

export class CvProfileStorage1771200000000 implements MigrationInterface {
  name = 'CvProfileStorage1771200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cv_profiles" (
        "id" SERIAL NOT NULL,
        "slug" varchar(64) NOT NULL DEFAULT 'primary',
        "content" jsonb NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cv_profiles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_cv_profiles_slug"
      ON "cv_profiles" ("slug")
    `);

    await queryRunner.query(`
      INSERT INTO "cv_profiles" ("slug", "content")
      VALUES (
        'primary',
        '{
          "fullName":"Your Name",
          "role":"Senior Software Engineer",
          "tagline":"Backend, cloud, and platform engineering with a focus on reliability and delivery velocity.",
          "chips":[
            "Location: City, Country",
            "Email: your@email.com"
          ],
          "sections":[
            {
              "id":"profile-summary",
              "title":"Profile Summary",
              "summary":"Short summary of your profile, seniority, and the type of impact you deliver.",
              "bullets":[
                "Define your specialization and strongest domain.",
                "Include one sentence about your engineering philosophy."
              ]
            }
          ]
        }'::jsonb
      )
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_cv_profiles_slug"`);
    await queryRunner.query(`DROP TABLE "cv_profiles"`);
  }
}

