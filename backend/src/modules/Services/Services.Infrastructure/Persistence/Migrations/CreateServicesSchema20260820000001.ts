import type { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
const UUID = 'CHAR(36) CHARACTER SET ascii COLLATE ascii_bin';

export class CreateServicesSchema20260820000001 implements MigrationInterface {
  public readonly name = 'CreateServicesSchema20260820000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE service (
      id ${UUID} NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      image_reference VARCHAR(2048) NOT NULL,
      status VARCHAR(16) NOT NULL,
      display_order INT UNSIGNED NOT NULL,
      CONSTRAINT pk_service PRIMARY KEY (id),
      CONSTRAINT uq_service_name UNIQUE (name),
      CONSTRAINT ck_service_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
      CONSTRAINT ck_service_image_reference CHECK (CHAR_LENGTH(TRIM(image_reference)) > 0),
      CONSTRAINT ck_service_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
      CONSTRAINT ck_service_display_order CHECK (display_order >= 0),
      INDEX ix_service_status (status)
    ) ${TABLE_OPTIONS}`);

    await queryRunner.query(`CREATE TABLE category (
      id ${UUID} NOT NULL,
      service_id ${UUID} NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      reference_image VARCHAR(2048) NOT NULL,
      status VARCHAR(16) NOT NULL,
      display_order INT UNSIGNED NOT NULL,
      CONSTRAINT pk_category PRIMARY KEY (id),
      CONSTRAINT fk_category_service FOREIGN KEY (service_id)
        REFERENCES service (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
      CONSTRAINT uq_category_service_id_name UNIQUE (service_id, name),
      CONSTRAINT ck_category_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
      CONSTRAINT ck_category_reference_image CHECK (CHAR_LENGTH(TRIM(reference_image)) > 0),
      CONSTRAINT ck_category_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
      CONSTRAINT ck_category_display_order CHECK (display_order >= 0),
      INDEX ix_category_status (status),
      INDEX ix_category_service_id_status (service_id, status)
    ) ${TABLE_OPTIONS}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE category');
    await queryRunner.query('DROP TABLE service');
  }
}
