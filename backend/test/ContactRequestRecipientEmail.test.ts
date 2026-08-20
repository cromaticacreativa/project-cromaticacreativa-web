import assert from 'node:assert/strict';
import test from 'node:test';
import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import type { CommandBus } from '@nestjs/cqrs';
import { ValidarCorreoReceptorCommand } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/ValidarCorreoReceptor/ValidarCorreoReceptorCommand';
import { ValidarCorreoReceptorCommandHandler } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/ValidarCorreoReceptor/ValidarCorreoReceptorCommandHandler';
import { InformacionDeContactoRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/InformacionDeContactoRechazadaException';
import { CompanyProfileCmsController } from '../src/modules/CompanyProfile/CompanyProfile.Presentation/Controllers/CompanyProfileCmsController';

const handler = new ValidarCorreoReceptorCommandHandler();

test('valida y canonicaliza el correo receptor (dominio en minúsculas)', async () => {
  const r = await handler.execute(new ValidarCorreoReceptorCommand('Contacto@EMPRESA.COM'));
  assert.equal(r.correo, 'Contacto@empresa.com');
});

async function rechazaCon(valor: unknown, patron: RegExp): Promise<void> {
  await assert.rejects(
    handler.execute(new ValidarCorreoReceptorCommand(valor)),
    (error: InformacionDeContactoRechazadaException) => {
      assert.ok(error instanceof InformacionDeContactoRechazadaException);
      assert.equal(error.errors[0]!.field, 'contact_request_recipient_email');
      assert.match(error.message, patron);
      return true;
    },
  );
}

test('rechaza faltante (null/undefined/no-string) como obligatorio', async () => {
  for (const valor of [null, undefined, 123]) {
    await rechazaCon(valor, /El correo receptor de solicitudes es obligatorio\./);
  }
});

test('rechaza vacío/espacios con mensaje de vacío', async () => {
  for (const valor of ['', '   ']) {
    await rechazaCon(valor, /El correo receptor de solicitudes no puede estar vacío\./);
  }
});

test('rechaza formato claramente inválido con ejemplo', async () => {
  for (const valor of ['aaaa', 'crom@', '@gmail.com', 'crom@@gmail.com', 'crom gmail@gmail.com', 'crom@.com', 'crom@gmail..com']) {
    await rechazaCon(valor, /debe tener un formato válido, por ejemplo: contacto@empresa\.com\./);
  }
});

test('rechaza dominio sin extensión (contacto@gmail) con mensaje de dominio completo', async () => {
  await rechazaCon('cromaticacreativa00@gmail', /debe incluir un dominio completo, por ejemplo: contacto@empresa\.com\./);
});

test('rechaza extensión incompleta (contacto@gmail.c) con mensaje de extensión válida', async () => {
  for (const valor of ['cromaticacreativa00@gmail.c', 'crom@gmail.']) {
    await rechazaCon(valor, /El dominio del correo receptor de solicitudes debe tener una extensión válida, por ejemplo: \.com, \.net u \.org\./);
  }
});

test('rechaza un correo receptor demasiado largo con mensaje específico', async () => {
  const largo = `${'a'.repeat(64)}@${`${'b'.repeat(63)}.`.repeat(3)}co`;
  assert.ok(largo.length > 254);
  await rechazaCon(largo, /El correo receptor de solicitudes supera la longitud máxima permitida\./);
});

test('aprueba correos válidos (personales y empresariales) y canonicaliza', async () => {
  for (const valido of ['cromaticacreativa00@gmail.com', 'info@empresa.com.ve', 'ventas@empresa.net', 'hola@organizacion.org', 'info@universidad.edu']) {
    const r = await handler.execute(new ValidarCorreoReceptorCommand(valido));
    assert.equal(r.correo.split('@')[1], valido.split('@')[1]!.toLowerCase());
  }
});

test('el endpoint devuelve el payload canónico del correo receptor', async () => {
  const commandBus = { execute: async () => ({ correo: 'ventas@empresa.com' }) } as unknown as CommandBus;
  const controller = new CompanyProfileCmsController(commandBus);
  const respuesta = await controller.validarCorreoReceptor({ collection: 'company_profile', payload: { contact_request_recipient_email: 'Ventas@EMPRESA.com' } });
  assert.deepEqual(respuesta.payload, { contact_request_recipient_email: 'ventas@empresa.com' });
});

test('el endpoint traduce el rechazo a 422 con field = columna de Directus', async () => {
  const commandBus = {
    execute: async () => { throw InformacionDeContactoRechazadaException.campo('contact_request_recipient_email', 'El correo receptor de solicitudes no es una dirección de correo válida.'); },
  } as unknown as CommandBus;
  const controller = new CompanyProfileCmsController(commandBus);
  await assert.rejects(
    controller.validarCorreoReceptor({ collection: 'company_profile', payload: { contact_request_recipient_email: 'aaaa' } }),
    (error: UnprocessableEntityException) => {
      assert.ok(error instanceof UnprocessableEntityException);
      assert.ok(!(error instanceof ConflictException));
      assert.equal(error.getStatus(), 422);
      const body = error.getResponse() as { errors: Array<{ field: string; message: string }> };
      assert.deepEqual(body.errors, [{ field: 'contact_request_recipient_email', message: 'El correo receptor de solicitudes no es una dirección de correo válida.' }]);
      return true;
    },
  );
});
