import type { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_OPTIONS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
const UUID = 'CHAR(36) CHARACTER SET ascii COLLATE ascii_bin';

export class CreateCompanyProfileSchema20260820000002 implements MigrationInterface {
  public readonly name = 'CreateCompanyProfileSchema20260820000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE company_profile (
      id ${UUID} NOT NULL,
      singleton_key TINYINT UNSIGNED NOT NULL DEFAULT 1,
      contact_request_recipient_email VARCHAR(254) NOT NULL,
      CONSTRAINT pk_company_profile PRIMARY KEY (id),
      CONSTRAINT uq_company_profile_singleton_key UNIQUE (singleton_key),
      CONSTRAINT ck_company_profile_singleton_key CHECK (singleton_key = 1),
      CONSTRAINT ck_company_profile_recipient_email
        CHECK (CHAR_LENGTH(TRIM(contact_request_recipient_email)) > 0)
    ) ${TABLE_OPTIONS}`);

    await queryRunner.query(`CREATE TABLE phone (
      id ${UUID} NOT NULL,
      company_profile_id ${UUID} NOT NULL,
      number VARCHAR(64) NOT NULL,
      display_order INT UNSIGNED NOT NULL,
      CONSTRAINT pk_phone PRIMARY KEY (id),
      CONSTRAINT fk_phone_company_profile FOREIGN KEY (company_profile_id)
        REFERENCES company_profile (id) ON DELETE CASCADE ON UPDATE RESTRICT,
      CONSTRAINT uq_phone_company_profile_id_number UNIQUE (company_profile_id, number),
      CONSTRAINT ck_phone_number CHECK (CHAR_LENGTH(TRIM(number)) > 0),
      CONSTRAINT ck_phone_display_order CHECK (display_order >= 0)
    ) ${TABLE_OPTIONS}`);

    await queryRunner.query(`CREATE TABLE email (
      id ${UUID} NOT NULL,
      company_profile_id ${UUID} NOT NULL,
      address VARCHAR(254) NOT NULL,
      display_order INT UNSIGNED NOT NULL,
      CONSTRAINT pk_email PRIMARY KEY (id),
      CONSTRAINT fk_email_company_profile FOREIGN KEY (company_profile_id)
        REFERENCES company_profile (id) ON DELETE CASCADE ON UPDATE RESTRICT,
      CONSTRAINT uq_email_company_profile_id_address UNIQUE (company_profile_id, address),
      CONSTRAINT ck_email_address CHECK (CHAR_LENGTH(TRIM(address)) > 0),
      CONSTRAINT ck_email_display_order CHECK (display_order >= 0)
    ) ${TABLE_OPTIONS}`);

    await queryRunner.query(`CREATE TABLE location (
      company_profile_id ${UUID} NOT NULL,
      address VARCHAR(500) NOT NULL,
      latitude DOUBLE NOT NULL,
      longitude DOUBLE NOT NULL,
      CONSTRAINT pk_location PRIMARY KEY (company_profile_id),
      CONSTRAINT fk_location_company_profile FOREIGN KEY (company_profile_id)
        REFERENCES company_profile (id) ON DELETE CASCADE ON UPDATE RESTRICT,
      CONSTRAINT ck_location_address CHECK (CHAR_LENGTH(TRIM(address)) > 0),
      CONSTRAINT ck_location_latitude CHECK (latitude BETWEEN -90 AND 90),
      CONSTRAINT ck_location_longitude CHECK (longitude BETWEEN -180 AND 180)
    ) ${TABLE_OPTIONS}`);

    await queryRunner.query(`CREATE TABLE social_link (
      id ${UUID} NOT NULL,
      company_profile_id ${UUID} NOT NULL,
      network VARCHAR(100) NOT NULL,
      url VARCHAR(2048) NOT NULL,
      display_order INT UNSIGNED NOT NULL,
      CONSTRAINT pk_social_link PRIMARY KEY (id),
      CONSTRAINT fk_social_link_company_profile FOREIGN KEY (company_profile_id)
        REFERENCES company_profile (id) ON DELETE CASCADE ON UPDATE RESTRICT,
      CONSTRAINT uq_social_link_company_profile_id_network UNIQUE (company_profile_id, network),
      CONSTRAINT ck_social_link_network CHECK (CHAR_LENGTH(TRIM(network)) > 0),
      CONSTRAINT ck_social_link_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
      CONSTRAINT ck_social_link_display_order CHECK (display_order >= 0)
    ) ${TABLE_OPTIONS}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE social_link');
    await queryRunner.query('DROP TABLE location');
    await queryRunner.query('DROP TABLE email');
    await queryRunner.query('DROP TABLE phone');
    await queryRunner.query('DROP TABLE company_profile');
  }
}
