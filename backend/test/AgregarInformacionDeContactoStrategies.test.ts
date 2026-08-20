import assert from 'node:assert/strict';
import test from 'node:test';
import { AgregarCorreoStrategy, TIPO_CORREO } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/AgregarCorreoStrategy';
import { AgregarRedSocialStrategy, TIPO_RED_SOCIAL } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/AgregarRedSocialStrategy';
import { AgregarTelefonoStrategy, TIPO_TELEFONO } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/AgregarTelefonoStrategy';
import { InformacionDeContactoRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/InformacionDeContactoRechazadaException';
import { ValidadoraTelefono } from '../src/modules/CompanyProfile/CompanyProfile.Application/Validations/ValidadoraTelefono';
import { CompanyContactInformation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { CompanyContactInformationId } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyContactInformationId';
import { EmailAddress } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/EmailAddress';
import { ExternalUrl } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/ExternalUrl';
import { PhoneNumber } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/PhoneNumber';
import { SocialLink } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/SocialLink';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';

function informacion(): CompanyContactInformation {
  return CompanyContactInformation.create(
    new CompanyContactInformationId(PROFILE_ID),
    new EmailAddress('recipient@example.com'),
  );
}

const telefono = new AgregarTelefonoStrategy(new ValidadoraTelefono());
const correo = new AgregarCorreoStrategy();
const redSocial = new AgregarRedSocialStrategy();

test('AgregarTelefonoStrategy solo soporta su tipo', () => {
  assert.equal(telefono.soporta({ tipo: TIPO_TELEFONO, datos: { numero: '+584121234567' } }), true);
  assert.equal(telefono.soporta({ tipo: TIPO_CORREO, datos: { correo: 'a@b.com' } }), false);
});

test('AgregarTelefonoStrategy valida, canonicaliza a E.164 y rechaza inválidos/duplicados', () => {
  const info = informacion();
  const resultado = telefono.ejecutar(info, { tipo: TIPO_TELEFONO, datos: { numero: '+58 0412 1234567' } });
  assert.deepEqual(resultado, {
    tipo: TIPO_TELEFONO,
    companyProfileId: PROFILE_ID,
    displayOrder: 0,
    datos: { numero: '+584121234567' },
  });
  assert.throws(
    () => telefono.ejecutar(informacion(), { tipo: TIPO_TELEFONO, datos: { numero: '+58 999 1234567' } }),
    InformacionDeContactoRechazadaException,
  );
  const conTelefono = informacion();
  conTelefono.addPhone(new PhoneNumber('+584121234567'));
  assert.throws(
    () => telefono.ejecutar(conTelefono, { tipo: TIPO_TELEFONO, datos: { numero: '+58 0412 1234567' } }),
    /ya está registrado/,
  );
});

test('AgregarTelefonoStrategy rechaza cuando falta el número (obligatorio)', () => {
  assert.throws(
    () => telefono.ejecutar(informacion(), { tipo: TIPO_TELEFONO, datos: {} }),
    /El número de teléfono es obligatorio/,
  );
  assert.throws(
    () => telefono.ejecutar(informacion(), { tipo: TIPO_TELEFONO, datos: { numero: null } }),
    /El número de teléfono es obligatorio/,
  );
});

test('AgregarCorreoStrategy valida el Value Object y rechaza inválidos/duplicados', () => {
  const info = informacion();
  const resultado = correo.ejecutar(info, { tipo: TIPO_CORREO, datos: { correo: 'ventas@example.com' } });
  assert.equal(resultado.datos['correo'], 'ventas@example.com');
  assert.throws(
    () => correo.ejecutar(informacion(), { tipo: TIPO_CORREO, datos: { correo: 'no-es-correo' } }),
    InformacionDeContactoRechazadaException,
  );
  // El correo público usa el mismo EmailAddress: un TLD incompleto también se rechaza.
  for (const invalido of ['correo@gmail.c', 'correo@gmail']) {
    assert.throws(
      () => correo.ejecutar(informacion(), { tipo: TIPO_CORREO, datos: { correo: invalido } }),
      /La dirección de correo electrónico no es válida/,
      invalido,
    );
  }
  const conCorreo = informacion();
  conCorreo.addEmail(new EmailAddress('ventas@example.com'));
  assert.throws(
    () => correo.ejecutar(conCorreo, { tipo: TIPO_CORREO, datos: { correo: 'ventas@example.com' } }),
    /ya está registrado/,
  );
});

test('AgregarRedSocialStrategy acepta WhatsApp como SocialLink y controla URL y red duplicada', () => {
  const info = informacion();
  const resultado = redSocial.ejecutar(info, {
    tipo: TIPO_RED_SOCIAL,
    datos: { red: 'WhatsApp', url: 'https://wa.me/584121234567' },
  });
  assert.equal(resultado.datos['red'], 'WhatsApp');
  assert.equal(resultado.datos['url'], 'https://wa.me/584121234567');
  assert.throws(
    () => redSocial.ejecutar(informacion(), { tipo: TIPO_RED_SOCIAL, datos: { red: 'Instagram', url: 'no-es-url' } }),
    InformacionDeContactoRechazadaException,
  );
  const conRed = informacion();
  conRed.addSocialLink(new SocialLink('WhatsApp', new ExternalUrl('https://wa.me/584121234567')));
  assert.throws(
    () => redSocial.ejecutar(conRed, { tipo: TIPO_RED_SOCIAL, datos: { red: 'whatsapp', url: 'https://wa.me/580000000000' } }),
    /Ya existe una red social registrada con ese nombre/,
  );
});

test('AgregarRedSocialStrategy acepta las redes frecuentes de la lista de UX', () => {
  for (const red of ['Instagram', 'Facebook', 'WhatsApp', 'LinkedIn', 'TikTok', 'YouTube', 'X (Twitter)', 'Pinterest', 'Telegram']) {
    const resultado = redSocial.ejecutar(informacion(), { tipo: TIPO_RED_SOCIAL, datos: { red, url: 'https://example.com/perfil' } });
    assert.equal(resultado.datos['red'], red);
  }
  // "Otra" es solo UX: el Domain acepta cualquier red escrita (nunca se guarda "Otra").
  const otra = redSocial.ejecutar(informacion(), { tipo: TIPO_RED_SOCIAL, datos: { red: 'Behance', url: 'https://behance.net/cromaticacreativa' } });
  assert.equal(otra.datos['red'], 'Behance');
});

test('AgregarRedSocialStrategy acumula los errores de red y URL de la misma operación', () => {
  assert.throws(
    () => redSocial.ejecutar(informacion(), { tipo: TIPO_RED_SOCIAL, datos: { red: '', url: 'hola' } }),
    (error: InformacionDeContactoRechazadaException) => {
      assert.ok(error instanceof InformacionDeContactoRechazadaException);
      assert.equal(error.esConflicto, false);
      assert.deepEqual(error.errors.map((e) => e.field).sort(), ['red', 'url']);
      assert.match(error.errors.find((e) => e.field === 'red')!.message, /red social/);
      assert.match(error.errors.find((e) => e.field === 'url')!.message, /HTTP o HTTPS/);
      assert.equal(error.message, 'Hay errores de validación.');
      return true;
    },
  );
});

test('las Strategy de correo y red social propagan los mensajes de obligatoriedad de los Value Objects', () => {
  assert.throws(
    () => correo.ejecutar(informacion(), { tipo: TIPO_CORREO, datos: {} }),
    /El correo electrónico es obligatorio/,
  );
  assert.throws(
    () => redSocial.ejecutar(informacion(), { tipo: TIPO_RED_SOCIAL, datos: { url: 'https://example.com' } }),
    /El nombre de la red social es obligatorio/,
  );
  assert.throws(
    () => redSocial.ejecutar(informacion(), { tipo: TIPO_RED_SOCIAL, datos: { red: 'Instagram' } }),
    /La URL es obligatoria/,
  );
});

test('cada Strategy rechaza una entrada que no soporta', () => {
  assert.throws(
    () => correo.ejecutar(informacion(), { tipo: TIPO_TELEFONO, datos: { numero: '+584121234567' } }),
    /solo procesa/,
  );
});
