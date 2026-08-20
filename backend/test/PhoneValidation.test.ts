import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidadoraTelefono } from '../src/modules/CompanyProfile/CompanyProfile.Application/Validations/ValidadoraTelefono';
import { InformacionDeContactoRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/InformacionDeContactoRechazadaException';

const validadora = new ValidadoraTelefono();

test('acepta un número venezolano válido y lo canonicaliza a E.164', () => {
  assert.equal(validadora.validar('+58 0412 1234567').value, '+584121234567');
  assert.equal(validadora.validar('+58 0414 1234567').value, '+584141234567');
});

test('rechaza un número venezolano con longitud incorrecta', () => {
  assert.throws(() => validadora.validar('+58 0412 12345'), InformacionDeContactoRechazadaException);
});

test('rechaza un prefijo incompatible con el plan del país', () => {
  assert.throws(() => validadora.validar('+58 999 1234567'), InformacionDeContactoRechazadaException);
});

test('acepta números de otros países en formato internacional', () => {
  assert.equal(validadora.validar('+1 202 555 0143').value, '+12025550143');
  assert.equal(validadora.validar('+34 612 345 678').value, '+34612345678');
});

test('rechaza un número de otro país imposible', () => {
  assert.throws(() => validadora.validar('+44 20 7946'), InformacionDeContactoRechazadaException);
});

test('rechaza faltantes (null/undefined/no-string) como obligatorio', () => {
  assert.throws(() => validadora.validar(null), /El número de teléfono es obligatorio/);
  assert.throws(() => validadora.validar(undefined), /El número de teléfono es obligatorio/);
  assert.throws(() => validadora.validar(1234567), /El número de teléfono es obligatorio/);
});

test('rechaza entrada vacía', () => {
  assert.throws(() => validadora.validar(''), /no puede estar vacío/);
  assert.throws(() => validadora.validar('   '), /no puede estar vacío/);
});

test("exige el prefijo internacional '+' cuando no hay región por defecto", () => {
  for (const sinPrefijo of ['04141234567', '4121234567', '58 412 1234567', 'hola mundo']) {
    assert.throws(() => validadora.validar(sinPrefijo), /debe incluir el código de país comenzando con '\+'/, sinPrefijo);
  }
});

test("con '+' pero incompatible con el plan, informa del plan de numeración", () => {
  for (const invalido of ['+58 123', '+999 12345', '+44 20 7946']) {
    assert.throws(() => validadora.validar(invalido), /plan de numeración válido/, invalido);
  }
});

test('normaliza formatos humanos con separadores y troncal', () => {
  assert.equal(validadora.validar('+58 (0412) 123-4567').value, '+584121234567');
  assert.equal(validadora.validar('  +584121234567  ').value, '+584121234567');
});

test('con una región por defecto acepta formato nacional sin prefijo internacional', () => {
  const nacional = new ValidadoraTelefono('VE');
  assert.equal(nacional.validar('04121234567').value, '+584121234567');
});
