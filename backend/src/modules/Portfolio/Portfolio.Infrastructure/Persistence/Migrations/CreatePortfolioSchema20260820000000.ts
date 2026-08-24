import type { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
const UUID = 'CHAR(36) CHARACTER SET ascii COLLATE ascii_bin';

export class CreatePortfolioSchema20260820000000 implements MigrationInterface {
  public readonly name = 'CreatePortfolioSchema20260820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE corporate_client (
      id ${UUID} NOT NULL,
      name VARCHAR(200) NOT NULL,
      logo_reference VARCHAR(2048) NOT NULL,
      visibility_status VARCHAR(16) NOT NULL,
      CONSTRAINT pk_corporate_client PRIMARY KEY (id),
      CONSTRAINT uq_corporate_client_name UNIQUE (name),
      CONSTRAINT ck_corporate_client_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
      CONSTRAINT ck_corporate_client_logo_reference CHECK (CHAR_LENGTH(TRIM(logo_reference)) > 0),
      CONSTRAINT ck_corporate_client_visibility_status CHECK (visibility_status IN ('VISIBLE', 'HIDDEN')),
      INDEX ix_corporate_client_visibility_status (visibility_status)
    ) ${TABLE_OPTIONS}`);

    await queryRunner.query(`CREATE TABLE project (
      id ${UUID} NOT NULL,
      title VARCHAR(300) NULL,
      description TEXT NOT NULL,
      publication_status VARCHAR(16) NOT NULL,
      display_order INT UNSIGNED NOT NULL,
      corporate_client_id ${UUID} NULL,
      service_id ${UUID} NOT NULL,
      category_id ${UUID} NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      CONSTRAINT pk_project PRIMARY KEY (id),
      CONSTRAINT fk_project_corporate_client FOREIGN KEY (corporate_client_id)
        REFERENCES corporate_client (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      CONSTRAINT ck_project_title CHECK (title IS NULL OR CHAR_LENGTH(TRIM(title)) > 0),
      CONSTRAINT ck_project_published_title CHECK (
        publication_status <> 'PUBLISHED' OR (title IS NOT NULL AND CHAR_LENGTH(TRIM(title)) > 0)),
      CONSTRAINT ck_project_publication_status CHECK (publication_status IN ('DRAFT', 'PUBLISHED')),
      CONSTRAINT ck_project_display_order CHECK (display_order >= 0),
      CONSTRAINT ck_project_period CHECK (end_date >= start_date),
      INDEX ix_project_publication_status (publication_status),
      INDEX ix_project_corporate_client_id (corporate_client_id),
      INDEX ix_project_service_id (service_id),
      INDEX ix_project_category_id (category_id),
      INDEX ix_project_publication_status_service_id_category_id (publication_status, service_id, category_id)
    ) ${TABLE_OPTIONS}`);

    await queryRunner.query(`CREATE TABLE media (
      id ${UUID} NOT NULL,
      project_id ${UUID} NOT NULL,
      reference VARCHAR(2048) NOT NULL,
      type VARCHAR(16) NOT NULL,
      display_order INT UNSIGNED NOT NULL,
      is_cover BOOLEAN NOT NULL DEFAULT FALSE,
      cover_marker TINYINT GENERATED ALWAYS AS (
        CASE WHEN is_cover = 1 THEN 1 ELSE NULL END) STORED,
      CONSTRAINT pk_media PRIMARY KEY (id),
      CONSTRAINT fk_media_project FOREIGN KEY (project_id)
        REFERENCES project (id) ON DELETE CASCADE ON UPDATE RESTRICT,
      CONSTRAINT ck_media_reference CHECK (CHAR_LENGTH(TRIM(reference)) > 0),
      CONSTRAINT ck_media_type CHECK (type IN ('IMAGE', 'VIDEO')),
      CONSTRAINT ck_media_display_order CHECK (display_order >= 0),
      INDEX ix_media_project_id (project_id),
      CONSTRAINT uq_media_project_cover UNIQUE (project_id, cover_marker)
    ) ${TABLE_OPTIONS}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE media');
    await queryRunner.query('DROP TABLE project');
    await queryRunner.query('DROP TABLE corporate_client');
  }
}
