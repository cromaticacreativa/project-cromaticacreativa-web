import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { CmsServiceAuthGuard } from '../src/Infrastructure/Security/CmsServiceAuthGuard';

const TOKEN = 'un-token-tecnico-largo-y-aleatorio';

function contexto(headers: Record<string, unknown>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ headers }) }) } as unknown as ExecutionContext;
}

function guardConToken(token: string | undefined): CmsServiceAuthGuard {
  return new CmsServiceAuthGuard({ get: () => token } as unknown as ConfigService);
}

test('acepta un token Bearer válido', () => {
  const guard = guardConToken(TOKEN);
  assert.equal(guard.canActivate(contexto({ authorization: `Bearer ${TOKEN}` })), true);
});

test('fail closed: rechaza cuando CMS_INTERNAL_TOKEN no está configurado', () => {
  assert.throws(
    () => guardConToken(undefined).canActivate(contexto({ authorization: `Bearer ${TOKEN}` })),
    /no está disponible/,
  );
});

test('rechaza cuando falta el encabezado de autorización', () => {
  assert.throws(() => guardConToken(TOKEN).canActivate(contexto({})), /encabezado de autorización/);
});

test('rechaza un esquema distinto de Bearer', () => {
  assert.throws(
    () => guardConToken(TOKEN).canActivate(contexto({ authorization: `Basic ${TOKEN}` })),
    /Bearer/,
  );
});

test('rechaza un formato de encabezado sin token', () => {
  assert.throws(() => guardConToken(TOKEN).canActivate(contexto({ authorization: 'Bearer' })), /Bearer/);
});

test('rechaza un token incorrecto de la misma longitud', () => {
  const otro = 'x'.repeat(TOKEN.length);
  assert.throws(
    () => guardConToken(TOKEN).canActivate(contexto({ authorization: `Bearer ${otro}` })),
    /Token de servicio inválido/,
  );
});

test('rechaza un token incorrecto de distinta longitud', () => {
  assert.throws(
    () => guardConToken(TOKEN).canActivate(contexto({ authorization: 'Bearer corto' })),
    /Token de servicio inválido/,
  );
});
