import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { DataSource, type QueryRunner } from 'typeorm';
import { getDatabaseConfiguration } from '../src/Infrastructure/Configuration/DatabaseConfiguration';
import { CreateCompanyProfileSchema20260820000002 } from '../src/modules/CompanyProfile/CompanyProfile.Infrastructure/Persistence/Migrations/CreateCompanyProfileSchema20260820000002';
import { CreatePortfolioSchema20260820000000 } from '../src/modules/Portfolio/Portfolio.Infrastructure/Persistence/Migrations/CreatePortfolioSchema20260820000000';
import { CreateServicesSchema20260820000001 } from '../src/modules/Services/Services.Infrastructure/Persistence/Migrations/CreateServicesSchema20260820000001';

const contexts = ['Portfolio', 'Services', 'CompanyProfile', 'Contact'];

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? typescriptFiles(path) : path.endsWith('.ts') ? [path] : [];
  });
}

test('cada Bounded Context materializa capas y Commons locales bajo src/modules', () => {
  for (const context of contexts) {
    const root = join('src', 'modules', context);
    for (const path of [
      `${context}.Domain/Abstract`, `${context}.Domain/Aggregates`, `${context}.Domain/Entities`,
      `${context}.Domain/ValueObjects`, `${context}.Application/Ports`,
      `${context}.Application/Validations`, `${context}.Infrastructure/Persistence`,
      `${context}.Presentation`, `${context}.Commons/DTOs`,
    ]) {
      assert.ok(existsSync(join(root, path)), `${context}/${path} debe existir`);
    }
  }
  assert.equal(existsSync(join('src', 'Commons')), false);
});

test('Domain y Application respetan la dirección de dependencias', () => {
  for (const context of contexts) {
    const root = join('src', 'modules', context);
    for (const file of typescriptFiles(join(root, `${context}.Domain`))) {
      const source = readFileSync(file, 'utf8');
      assert.doesNotMatch(source, /@nestjs|typeorm|mysql2|\.Application|\.Infrastructure|\.Presentation|\.Commons/,
        relative('src', file));
      assert.doesNotMatch(source,
        /(?:import\s+(?:[^'\"]+\s+from\s+)?|export\s+[^'\"]+\s+from\s+|require\s*\(|import\s*\()\s*['\"](?:node:)?crypto['\"]/,
        `${relative('src', file)} no debe importar crypto`);
      assert.doesNotMatch(source,
        /import\s*\{[^}]*\brandomUUID\b[^}]*\}\s*from\s*['\"][^'\"]+['\"]/,
        `${relative('src', file)} no debe importar randomUUID`);
    }
    for (const file of typescriptFiles(join(root, `${context}.Application`))) {
      const source = readFileSync(file, 'utf8');
      assert.doesNotMatch(source, /typeorm|mysql2|\.Infrastructure|\.Presentation/, relative('src', file));
    }
  }
});

test('Abstract contiene únicamente interfaces con prefijo I', () => {
  for (const context of contexts) {
    const directory = join('src', 'modules', context, `${context}.Domain`, 'Abstract');
    for (const file of typescriptFiles(directory)) {
      const source = readFileSync(file, 'utf8');
      assert.match(source, /export interface I[A-Z]/, relative('src', file));
      assert.doesNotMatch(source, /export (abstract )?class/, relative('src', file));
    }
  }
});

test('la configuración MySQL usa un DataSource, diez modelos, tres migrations y synchronize false', async () => {
  assert.throws(() => getDatabaseConfiguration({}), /MYSQL_PORT/);
  const options = getDatabaseConfiguration({
    MYSQL_HOST: 'localhost', MYSQL_PORT: '3306', MYSQL_DATABASE: 'db',
    MYSQL_USER: 'user', MYSQL_PASSWORD: 'secret',
  });
  assert.equal(options.type, 'mysql');
  assert.equal(options.synchronize, false);
  assert.equal(options.migrationsTableName, 'typeorm_migration');
  assert.equal(Array.isArray(options.migrations) ? options.migrations.length : 0, 3);
  const source = new DataSource(options) as DataSource & { buildMetadatas(): Promise<void> };
  await source.buildMetadatas();
  assert.equal(source.entityMetadatas.length, 10);
  assert.ok(source.entityMetadatas.some((metadata) => metadata.tableName === 'media'));
});

test('las migrations por módulo crean solo sus tablas propietarias y Contact no tiene tabla', async () => {
  async function sqlFor(migration: { up(runner: QueryRunner): Promise<void> }): Promise<string> {
    const statements: string[] = [];
    const runner = { query: async (sql: string) => { statements.push(sql); return undefined; } } as unknown as QueryRunner;
    await migration.up(runner);
    return statements.join('\n');
  }

  const portfolio = await sqlFor(new CreatePortfolioSchema20260820000000());
  assert.match(portfolio, /CREATE TABLE corporate_client/);
  assert.match(portfolio, /CREATE TABLE project/);
  assert.match(portfolio, /CREATE TABLE media/);
  assert.doesNotMatch(portfolio, /CREATE TABLE service\b|CREATE TABLE company_profile|CREATE TABLE contact_request/i);
  assert.match(portfolio, /CASE WHEN is_cover = 1 THEN project_id ELSE NULL END/);
  assert.match(portfolio, /UNIQUE \(cover_project_id\)/);
  assert.doesNotMatch(portfolio, /fk_project_service|fk_project_category/i);

  const services = await sqlFor(new CreateServicesSchema20260820000001());
  assert.match(services, /CREATE TABLE service/);
  assert.match(services, /CREATE TABLE category/);
  assert.doesNotMatch(services, /CREATE TABLE project|CREATE TABLE company_profile|CREATE TABLE contact_request/i);

  const profile = await sqlFor(new CreateCompanyProfileSchema20260820000002());
  for (const table of ['company_profile', 'phone', 'email', 'location', 'social_link']) {
    assert.match(profile, new RegExp(`CREATE TABLE ${table}`));
  }
  assert.match(profile, /contact_request_recipient_email VARCHAR\(254\) NOT NULL/);
  assert.match(profile, /uq_phone_company_profile_id_number UNIQUE \(company_profile_id, number\)/);
  assert.match(profile, /uq_email_company_profile_id_address UNIQUE \(company_profile_id, address\)/);
  assert.match(profile, /pk_location PRIMARY KEY \(company_profile_id\)/);
  assert.match(profile, /latitude DOUBLE NOT NULL/);
  assert.match(profile, /longitude DOUBLE NOT NULL/);
  assert.doesNotMatch(profile, /ck_phone_type|ck_email_type|uq_location_company_profile_id|\btype VARCHAR/);
  assert.doesNotMatch(profile, /CREATE TABLE project|CREATE TABLE service\b|CREATE TABLE contact_request/i);
});

test('no existen estructura anterior, Database global, Shared Domain ni frontend implementado', () => {
  for (const context of contexts) assert.equal(existsSync(join('src', context)), false);
  assert.equal(existsSync(join('src', 'database')), false);
  assert.equal(existsSync(join('src', 'shared')), false);
  assert.equal(existsSync(join('..', 'frontend', 'package.json')), false);
});
