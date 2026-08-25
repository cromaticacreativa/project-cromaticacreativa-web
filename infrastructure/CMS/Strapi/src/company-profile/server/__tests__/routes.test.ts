import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRoutes } from '../routes';
import { ACTIONS } from '../permissions';
import type { CompanyProfileControllers } from '../controller';

// Controllers stub (no se invocan; solo se inspecciona la configuración de rutas).
const stub = new Proxy({}, { get: () => () => undefined }) as unknown as CompanyProfileControllers;

function actionsOf(config: unknown): string[] {
  const policies = (config as { policies?: unknown[] }).policies ?? [];
  const hp = policies.find(
    (p): p is { name: string; config: { actions: string[] } } =>
      typeof p === 'object' && p !== null && (p as { name?: string }).name === 'admin::hasPermissions',
  );
  return hp?.config.actions ?? [];
}

test('todas las rutas son admin y exigen admin::isAuthenticatedAdmin', () => {
  const router = buildRoutes(stub);
  assert.equal(router.type, 'admin');
  for (const r of router.routes) {
    assert.ok(r.config.policies.includes('admin::isAuthenticatedAdmin'), `${r.method} ${r.path} sin isAuthenticatedAdmin`);
  }
});

test('cada método exige el permiso RBAC correcto (read/create/update/delete)', () => {
  const byKey = new Map(buildRoutes(stub).routes.map((r) => [`${r.method} ${r.path}`, r]));
  const expect = (key: string, action: string) =>
    assert.deepEqual(actionsOf(byKey.get(key)!.config), [action], `${key} → ${action}`);

  expect('GET /company-profile/informacion-general', ACTIONS.read);
  expect('GET /company-profile/geocode', ACTIONS.read);
  expect('POST /company-profile/initialize', ACTIONS.create);
  expect('POST /company-profile/phones', ACTIONS.create);
  expect('POST /company-profile/emails', ACTIONS.create);
  expect('POST /company-profile/social-links', ACTIONS.create);
  expect('POST /company-profile/location', ACTIONS.create);
  expect('PUT /company-profile/recipient-email', ACTIONS.update);
  expect('PUT /company-profile/phones/:id', ACTIONS.update);
  expect('PUT /company-profile/emails/:id', ACTIONS.update);
  expect('PUT /company-profile/social-links/:id', ACTIONS.update);
  expect('PUT /company-profile/location', ACTIONS.update);
  expect('DELETE /company-profile/phones/:id', ACTIONS.delete);
  expect('DELETE /company-profile/emails/:id', ACTIONS.delete);
  expect('DELETE /company-profile/social-links/:id', ACTIONS.delete);
  expect('DELETE /company-profile/location', ACTIONS.delete);
});

test('los action UIDs siguen el formato admin::company-profile.<op>', () => {
  assert.equal(ACTIONS.read, 'admin::company-profile.read');
  assert.equal(ACTIONS.create, 'admin::company-profile.create');
  assert.equal(ACTIONS.update, 'admin::company-profile.update');
  assert.equal(ACTIONS.delete, 'admin::company-profile.delete');
});
