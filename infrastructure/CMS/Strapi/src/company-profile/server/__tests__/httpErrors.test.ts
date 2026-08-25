import assert from 'node:assert/strict';
import test from 'node:test';
import { BusinessRejectionError, TechnicalError } from '../errors';
import { HttpCtx, sendError } from '../httpErrors';

function ctx(): HttpCtx {
  return { status: 200, body: undefined };
}

test('BusinessRejectionError → status y errors expuestos a la UI', () => {
  const c = ctx();
  sendError(c, new BusinessRejectionError('Duplicado.', 409, [{ field: 'number', message: 'x' }]));
  assert.equal(c.status, 409);
  assert.deepEqual(c.body, { error: { status: 409, message: 'Duplicado.', details: { errors: [{ field: 'number', message: 'x' }] } } });
});

test('TechnicalError → 502 genérico', () => {
  const c = ctx();
  sendError(c, new TechnicalError());
  assert.equal(c.status, 502);
});

test('error desconocido → 500 sin filtrar detalles (stack/SQL/secreto)', () => {
  const c = ctx();
  sendError(c, new Error('SELECT * FROM company_profile; ECONNREFUSED 10.0.0.5 token=abc'));
  assert.equal(c.status, 500);
  const body = JSON.stringify(c.body);
  assert.doesNotMatch(body, /SELECT|ECONNREFUSED|10\.0\.0\.5|token=abc/);
});
