import assert from 'node:assert/strict';
import test from 'node:test';
import { BusinessRejectionError, mapDatabaseError, TechnicalError } from '../errors';

test('mapDatabaseError traduce ER_DUP_ENTRY a rechazo 409', () => {
  const mapped = mapDatabaseError({ code: 'ER_DUP_ENTRY' });
  assert.ok(mapped instanceof BusinessRejectionError);
  assert.equal((mapped as BusinessRejectionError).status, 409);
});

test('mapDatabaseError traduce FK a rechazo 409', () => {
  assert.ok(mapDatabaseError({ code: 'ER_NO_REFERENCED_ROW_2' }) instanceof BusinessRejectionError);
  assert.ok(mapDatabaseError({ code: 'ER_ROW_IS_REFERENCED_2' }) instanceof BusinessRejectionError);
});

test('mapDatabaseError traduce CHECK a rechazo 422', () => {
  const mapped = mapDatabaseError({ code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
  assert.ok(mapped instanceof BusinessRejectionError);
  assert.equal((mapped as BusinessRejectionError).status, 422);
});

test('mapDatabaseError degrada errores desconocidos a TechnicalError (sin filtrar detalles)', () => {
  const mapped = mapDatabaseError(new Error('connect ECONNREFUSED 10.0.0.5:3306 secret-sql'));
  assert.ok(mapped instanceof TechnicalError);
  assert.doesNotMatch(mapped.message, /ECONNREFUSED|3306|secret-sql/);
});
