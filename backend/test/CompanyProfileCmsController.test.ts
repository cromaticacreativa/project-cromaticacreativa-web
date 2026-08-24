import assert from 'node:assert/strict';
import test from 'node:test';
import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import type { CommandBus } from '@nestjs/cqrs';
import { InformacionDeContactoRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/InformacionDeContactoRechazadaException';
import { UbicacionRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/UbicacionRechazadaException';
import { TIPO_TELEFONO } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/AgregarTelefonoStrategy';
import { CompanyProfileCmsController } from '../src/modules/CompanyProfile/CompanyProfile.Presentation/Controllers/CompanyProfileCmsController';

function controller(execute: () => Promise<unknown>): CompanyProfileCmsController {
  const commandBus = { execute } as unknown as CommandBus;
  return new CompanyProfileCmsController(commandBus);
}

test('traduce un rechazo de validación de contacto a 422 con errors[] y columna de negocio', async () => {
  const sut = controller(async () => {
    throw InformacionDeContactoRechazadaException.campo('numero', "El número de teléfono debe incluir el código de país comenzando con '+'.");
  });
  await assert.rejects(
    sut.agregarInformacionDeContacto({ collection: 'phone', payload: { number: '04141234567' } }),
    (error: UnprocessableEntityException) => {
      assert.ok(error instanceof UnprocessableEntityException);
      assert.equal(error.getStatus(), 422);
      const body = error.getResponse() as { statusCode: number; message: string; errors: Array<{ field: string; message: string }> };
      assert.equal(body.statusCode, 422);
      assert.deepEqual(body.errors, [{ field: 'number', message: "El número de teléfono debe incluir el código de país comenzando con '+'." }]);
      return true;
    },
  );
});

test('traduce un conflicto (duplicado) de contacto a HTTP 409', async () => {
  const sut = controller(async () => {
    throw InformacionDeContactoRechazadaException.conflicto('correo', 'Este correo electrónico ya está registrado.');
  });
  await assert.rejects(
    sut.agregarInformacionDeContacto({ collection: 'email', payload: { address: 'a@b.com' } }),
    (error: ConflictException) => {
      assert.ok(error instanceof ConflictException);
      assert.equal(error.getStatus(), 409);
      const body = error.getResponse() as { statusCode: number; errors: Array<{ field: string; message: string }> };
      assert.deepEqual(body.errors, [{ field: 'address', message: 'Este correo electrónico ya está registrado.' }]);
      return true;
    },
  );
});

test('traduce un rechazo de ubicación con múltiples errores a 422 con columnas de negocio', async () => {
  const sut = controller(async () => {
    throw UbicacionRechazadaException.acumulada([
      { field: 'direccion', message: 'La dirección no puede estar vacía.' },
      { field: 'latitud', message: 'La latitud debe estar entre -90 y 90.' },
      { field: 'longitud', message: 'La longitud debe estar entre -180 y 180.' },
    ]);
  });
  await assert.rejects(
    sut.agregarUbicacion({ collection: 'location', payload: { address: '', latitude: 200, longitude: -500 } }),
    (error: UnprocessableEntityException) => {
      assert.ok(error instanceof UnprocessableEntityException);
      assert.equal(error.getStatus(), 422);
      const body = error.getResponse() as { statusCode: number; message: string; errors: Array<{ field: string; message: string }> };
      assert.equal(body.message, 'Hay errores de validación.');
      assert.deepEqual(body.errors, [
        { field: 'address', message: 'La dirección no puede estar vacía.' },
        { field: 'latitude', message: 'La latitud debe estar entre -90 y 90.' },
        { field: 'longitude', message: 'La longitud debe estar entre -180 y 180.' },
      ]);
      return true;
    },
  );
});

test('traduce el conflicto de ubicación existente a HTTP 409', async () => {
  const sut = controller(async () => {
    throw UbicacionRechazadaException.conflicto('Ya existe una ubicación registrada.');
  });
  await assert.rejects(
    sut.agregarUbicacion({ collection: 'location', payload: {} }),
    (error: ConflictException) => {
      assert.ok(error instanceof ConflictException);
      assert.equal(error.getStatus(), 409);
      const body = error.getResponse() as { message: string; errors: unknown[] };
      assert.equal(body.message, 'Ya existe una ubicación registrada.');
      assert.deepEqual(body.errors, []);
      return true;
    },
  );
});

test('un error técnico inesperado no se convierte en 4xx (se propaga)', async () => {
  const sut = controller(async () => {
    throw new Error('fallo técnico interno');
  });
  await assert.rejects(
    sut.agregarInformacionDeContacto({ collection: 'phone', payload: { number: '+584121234567' } }),
    (error: Error) => {
      assert.ok(!(error instanceof UnprocessableEntityException));
      assert.ok(!(error instanceof ConflictException));
      return true;
    },
  );
});

test('en éxito, devuelve el payload canónico mapeado', async () => {
  const sut = controller(async () => ({
    tipo: TIPO_TELEFONO,
    companyProfileId: '11111111-1111-4111-8111-111111111111',
    displayOrder: 0,
    datos: { numero: '+584121234567' },
  }));
  const respuesta = await sut.agregarInformacionDeContacto({ collection: 'phone', payload: { number: '+58 0412 1234567' } });
  assert.deepEqual(respuesta.payload, {
    company_profile_id: '11111111-1111-4111-8111-111111111111',
    number: '+584121234567',
    display_order: 0,
  });
});
