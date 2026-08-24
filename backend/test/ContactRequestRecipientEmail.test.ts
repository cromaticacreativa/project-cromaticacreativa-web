import assert from 'node:assert/strict';
import test from 'node:test';
import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import type { CommandBus } from '@nestjs/cqrs';
import { AgregarInformacionDeContactoCommand } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/AgregarInformacionDeContacto/AgregarInformacionDeContactoCommand';
import { InformacionDeContactoRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/InformacionDeContactoRechazadaException';
import { TIPO_CORREO_RECEPTOR } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/AgregarCorreoReceptorStrategy';
import { ValidadoraCorreo } from '../src/modules/CompanyProfile/CompanyProfile.Application/Validations/ValidadoraCorreo';
import { CompanyProfileCmsController } from '../src/modules/CompanyProfile/CompanyProfile.Presentation/Controllers/CompanyProfileCmsController';

const validadora = new ValidadoraCorreo();

function rechazaCon(valor: unknown, patron: RegExp): void {
  assert.throws(
    () => validadora.validar(valor),
    (error: InformacionDeContactoRechazadaException) => {
      assert.ok(error instanceof InformacionDeContactoRechazadaException);
      assert.equal(error.errors[0]!.field, 'correo');
      assert.match(error.message, patron);
      return true;
    },
  );
}

test('ValidadoraCorreo rechaza null, undefined y no-string como obligatorio', () => {
  for (const valor of [null, undefined, 123]) {
    rechazaCon(valor, /El correo electrónico es obligatorio\./);
  }
});

test('ValidadoraCorreo rechaza vacío y espacios', () => {
  for (const valor of ['', '   ']) {
    rechazaCon(valor, /El correo electrónico no puede estar vacío\./);
  }
});

test('ValidadoraCorreo traduce formato, dominio y tld sin duplicar reglas', () => {
  for (const valor of ['aaaa', 'crom@', '@gmail.com', 'crom@@gmail.com', 'crom@gmail..com']) {
    rechazaCon(valor, /debe tener un formato válido, por ejemplo: contacto@empresa\.com\./);
  }
  rechazaCon(
    'cromaticacreativa00@gmail',
    /debe incluir un dominio completo, por ejemplo: contacto@empresa\.com\./,
  );
  for (const valor of ['cromaticacreativa00@gmail.c', 'crom@gmail.']) {
    rechazaCon(valor, /El dominio del correo electrónico debe tener una extensión válida/);
  }
});

test('ValidadoraCorreo traduce el exceso de longitud', () => {
  const largo = `${'a'.repeat(64)}@${`${'b'.repeat(63)}.`.repeat(3)}co`;
  assert.ok(largo.length > 254);
  rechazaCon(largo, /El correo electrónico supera la longitud máxima permitida\./);
});

test('ValidadoraCorreo acepta correos válidos y devuelve EmailAddress canónico', () => {
  for (const valido of [
    'cromaticacreativa00@gmail.com',
    'info@empresa.com.ve',
    'ventas@empresa.net',
    'hola@organizacion.org',
  ]) {
    assert.equal(validadora.validar(valido).value, valido);
  }
  assert.equal(validadora.validar(' Contacto@EMPRESA.COM ').value, 'Contacto@empresa.com');
});

test('el endpoint receptor despacha AgregarInformacionDeContactoCommand y devuelve el payload canónico', async () => {
  let recibido: unknown;
  const commandBus = {
    execute: async (command: unknown) => {
      recibido = command;
      return { tipo: TIPO_CORREO_RECEPTOR, datos: { correo: 'Ventas@empresa.com' } };
    },
  } as unknown as CommandBus;
  const controller = new CompanyProfileCmsController(commandBus);
  const respuesta = await controller.agregarCorreoReceptor({
    collection: 'company_profile',
    payload: { contact_request_recipient_email: 'Ventas@EMPRESA.com' },
  });
  assert.ok(recibido instanceof AgregarInformacionDeContactoCommand);
  assert.deepEqual(recibido.entrada, {
    tipo: TIPO_CORREO_RECEPTOR,
    datos: { correo: 'Ventas@EMPRESA.com' },
  });
  assert.deepEqual(respuesta, {
    payload: { contact_request_recipient_email: 'Ventas@empresa.com' },
  });
});

test('el endpoint receptor traduce el rechazo a 422 con la columna de negocio', async () => {
  const commandBus = {
    execute: async () => {
      throw InformacionDeContactoRechazadaException.campo(
        'correo',
        'El correo electrónico debe tener un formato válido, por ejemplo: contacto@empresa.com.',
      );
    },
  } as unknown as CommandBus;
  const controller = new CompanyProfileCmsController(commandBus);
  await assert.rejects(
    controller.agregarCorreoReceptor({
      collection: 'company_profile',
      payload: { contact_request_recipient_email: 'aaaa' },
    }),
    (error: UnprocessableEntityException) => {
      assert.ok(error instanceof UnprocessableEntityException);
      assert.ok(!(error instanceof ConflictException));
      assert.equal(error.getStatus(), 422);
      const body = error.getResponse() as {
        errors: Array<{ field: string; message: string }>;
      };
      assert.deepEqual(body.errors, [{
        field: 'contact_request_recipient_email',
        message: 'El correo electrónico debe tener un formato válido, por ejemplo: contacto@empresa.com.',
      }]);
      return true;
    },
  );
});
