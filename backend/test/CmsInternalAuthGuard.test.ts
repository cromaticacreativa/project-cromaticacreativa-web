import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { CmsInternalAuthGuard } from '../src/Infrastructure/Security/CmsInternalAuthGuard';
import { CompanyProfileCmsController } from '../src/modules/CompanyProfile/CompanyProfile.Presentation/Controllers/CompanyProfileCmsController';

const TOKEN = 'un-token-tecnico-largo-y-aleatorio';

function contexto(headers: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ headers }) }) } as unknown as ExecutionContext;
}

function guardConToken(token: string | undefined): CmsInternalAuthGuard {
  return new CmsInternalAuthGuard({ get: () => token } as unknown as ConfigService);
}

test('acepta un token Bearer válido', () => {
  const guard = guardConToken(TOKEN);
  assert.equal(guard.canActivate(contexto({ authorization: `Bearer ${TOKEN}` })), true);
});

test('rechaza cuando falta el encabezado de autorización', () => {
  assert.throws(() => guardConToken(TOKEN).canActivate(contexto({})), /encabezado de autorización/);
});

test('rechaza un esquema distinto de Bearer', () => {
  assert.throws(
    () => guardConToken(TOKEN).canActivate(contexto({ authorization: `Basic ${TOKEN}` })),
    /debe ser Bearer/,
  );
});

test('rechaza un token incorrecto', () => {
  assert.throws(
    () => guardConToken(TOKEN).canActivate(contexto({ authorization: 'Bearer token-equivocado' })),
    /inválida/,
  );
});

test('falla cerrado cuando el token técnico no está configurado', () => {
  assert.throws(() => guardConToken(undefined).canActivate(contexto({ authorization: `Bearer ${TOKEN}` })), /no está configurado/);
  assert.throws(() => guardConToken('   ').canActivate(contexto({ authorization: 'Bearer    ' })), /no está configurado/);
});

test('el endpoint interno declara el guard de autenticación técnica', () => {
  const guards = (Reflect.getMetadata('__guards__', CompanyProfileCmsController) ?? []) as unknown[];
  assert.ok(guards.includes(CmsInternalAuthGuard), 'el controller debe estar protegido por CmsInternalAuthGuard');
});
