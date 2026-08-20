import assert from 'node:assert/strict';
import test from 'node:test';
import { CompanyContactInformation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { Address } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/Address';
import { CompanyContactInformationId } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyContactInformationId';
import { EmailAddress } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/EmailAddress';
import { ExternalUrl } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/ExternalUrl';
import { GeoCoordinates } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/GeoCoordinates';
import { SocialLink } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/SocialLink';

// Los Value Objects reciben datos crudos desde la frontera; se prueban valores
// runtime malformados con casts controlados (unknown → tipo esperado).
const crudo = (value: unknown): string => value as string;

test('EmailAddress acepta correos válidos de cualquier proveedor y dominio', () => {
  for (const valido of [
    'contacto@gmail.com', 'contacto@hotmail.com', 'contacto@outlook.com',
    'ventas@cromaticacreativa.com', 'ventas@empresa.com.ve', 'info@empresa.io',
    'nombre.apellido@empresa.com', 'usuario+tag@empresa.com',
    'ventas@empresa.net', 'hola@organizacion.org', 'info@universidad.edu',
  ]) {
    assert.equal(new EmailAddress(valido).value, valido);
  }
  // Sin allowlist de proveedores ni transformaciones específicas de Gmail.
  assert.equal(new EmailAddress('  Usuario+Tag@empresa.com  ').value, 'Usuario+Tag@empresa.com');
});

test('EmailAddress normaliza el dominio a minúsculas y preserva la parte local', () => {
  assert.equal(new EmailAddress('angelodima12@GMAIL.COM').value, 'angelodima12@gmail.com');
  assert.equal(new EmailAddress('AngeloDima12@GmAiL.CoM').value, 'AngeloDima12@gmail.com');
  assert.equal(new EmailAddress('Usuario+Tag@EMPRESA.COM').value, 'Usuario+Tag@empresa.com');
  assert.equal(new EmailAddress('  Usuario+Tag@EMPRESA.COM  ').value, 'Usuario+Tag@empresa.com');
  assert.equal(new EmailAddress('Ventas@EMPRESA.COM.VE').value, 'Ventas@empresa.com.ve');
  // La parte local NO se convierte a minúsculas (puede ser sensible a mayúsculas).
  assert.notEqual(new EmailAddress('AngeloDima12@GMAIL.COM').value, 'angelodima12@gmail.com');
});

test('la normalización del dominio permite detectar correos duplicados', () => {
  const perfil = CompanyContactInformation.create(
    new CompanyContactInformationId('11111111-1111-4111-8111-111111111111'),
    new EmailAddress('recipient@example.com'),
  );
  assert.equal(perfil.addEmail(new EmailAddress('ventas@GMAIL.COM')), true);
  assert.deepEqual(perfil.emails.map((e) => e.value), ['ventas@gmail.com']);
  // Mismo correo con dominio en otra caja → duplicado detectado.
  assert.equal(perfil.addEmail(new EmailAddress('ventas@gmail.com')), false);
  // La parte local sí distingue mayúsculas: no es el mismo correo.
  assert.equal(perfil.addEmail(new EmailAddress('Ventas@gmail.com')), true);
  assert.deepEqual(perfil.emails.map((e) => e.value), ['ventas@gmail.com', 'Ventas@gmail.com']);
});

test('EmailAddress rechaza faltantes, vacíos, formatos y longitud con mensajes específicos', () => {
  assert.throws(() => new EmailAddress(crudo(null)), /El correo electrónico es obligatorio/);
  assert.throws(() => new EmailAddress(crudo(undefined)), /El correo electrónico es obligatorio/);
  assert.throws(() => new EmailAddress(crudo(123)), /El correo electrónico es obligatorio/);
  assert.throws(() => new EmailAddress(''), /El correo electrónico no puede estar vacío/);
  assert.throws(() => new EmailAddress('   '), /El correo electrónico no puede estar vacío/);
  for (const invalido of [
    'correo', '@empresa.com', 'usuario@', 'usuario@dominio', 'usuario@@empresa.com',
    'usuario..doble@empresa.com', '.usuario@empresa.com', 'usuario.@empresa.com',
    'usuario@.com', 'usuario@empresa.', 'usuario@-empresa.com', 'usuario@empresa-.com',
    'usuario con espacio@empresa.com', 'usuario@empresa .com',
    // TLD incompleto/ inválido y dominio sin extensión (mismo mensaje visible).
    'usuario@gmail', 'usuario@gmail.c', 'usuario@empresa.co2', 'usuario@empresa.c',
  ]) {
    assert.throws(() => new EmailAddress(invalido), /La dirección de correo electrónico no es válida/, invalido);
  }
  const largo = `${'a'.repeat(64)}@${`${'b'.repeat(63)}.`.repeat(3)}co`;
  assert.ok(largo.length > 254);
  assert.throws(() => new EmailAddress(largo), /no puede superar 254 caracteres/);
});

test('ExternalUrl acepta HTTP/HTTPS y rechaza faltante, vacío, protocolo y longitud', () => {
  assert.equal(new ExternalUrl('https://instagram.com/empresa').value, 'https://instagram.com/empresa');
  assert.equal(new ExternalUrl('http://example.com').value, 'http://example.com');
  assert.throws(() => new ExternalUrl(crudo(null)), /La URL es obligatoria/);
  assert.throws(() => new ExternalUrl(crudo(undefined)), /La URL es obligatoria/);
  assert.throws(() => new ExternalUrl(''), /La URL no puede estar vacía/);
  assert.throws(() => new ExternalUrl('hola'), /HTTP o HTTPS/);
  assert.throws(() => new ExternalUrl('ftp://example.com/x'), /HTTP o HTTPS/);
  const larga = `https://example.com/${'a'.repeat(2048)}`;
  assert.throws(() => new ExternalUrl(larga), /no puede superar 2048 caracteres/);
});

test('SocialLink valida la red, admite WhatsApp y otros medios, y rechaza faltantes/largos', () => {
  const url = new ExternalUrl('https://wa.me/584121234567');
  assert.equal(new SocialLink('WhatsApp', url).network, 'WhatsApp');
  assert.equal(new SocialLink('OtroMedio', new ExternalUrl('https://example.com/perfil')).network, 'OtroMedio');
  assert.throws(() => new SocialLink(crudo(null), url), /El nombre de la red social es obligatorio/);
  assert.throws(() => new SocialLink(crudo(undefined), url), /El nombre de la red social es obligatorio/);
  assert.throws(() => new SocialLink('', url), /La red social no puede estar vacía/);
  assert.throws(() => new SocialLink('   ', url), /La red social no puede estar vacía/);
  assert.throws(() => new SocialLink('r'.repeat(101), url), /no puede superar 100 caracteres/);
  // No se valida ninguna extensión multimedia: una URL de perfil válida se acepta.
  assert.doesNotThrow(() => new SocialLink('Portafolio', new ExternalUrl('https://example.com/video.mp4')));
});

test('Address valida obligatoria, vacía y longitud máxima 500', () => {
  assert.equal(new Address('  Av. Principal, Caracas  ').value, 'Av. Principal, Caracas');
  assert.equal(new Address('a'.repeat(500)).value, 'a'.repeat(500));
  assert.throws(() => new Address(crudo(null)), /La dirección es obligatoria/);
  assert.throws(() => new Address(crudo(undefined)), /La dirección es obligatoria/);
  assert.throws(() => new Address(''), /La dirección no puede estar vacía/);
  assert.throws(() => new Address('   '), /La dirección no puede estar vacía/);
  assert.throws(() => new Address('a'.repeat(501)), /no puede superar 500 caracteres/);
});

test('GeoCoordinates acepta límites exactos y rechaza rango y no finitos con mensajes claros', () => {
  assert.doesNotThrow(() => new GeoCoordinates(-90, -180));
  assert.doesNotThrow(() => new GeoCoordinates(90, 180));
  assert.doesNotThrow(() => new GeoCoordinates(0, 0));
  assert.throws(() => new GeoCoordinates(-90.0001, 0), /latitud debe estar entre -90 y 90/);
  assert.throws(() => new GeoCoordinates(90.0001, 0), /latitud debe estar entre -90 y 90/);
  assert.throws(() => new GeoCoordinates(0, -180.0001), /longitud debe estar entre -180 y 180/);
  assert.throws(() => new GeoCoordinates(0, 180.0001), /longitud debe estar entre -180 y 180/);
  assert.throws(() => new GeoCoordinates(Number.NaN, 0), /valores numéricos finitos/);
  assert.throws(() => new GeoCoordinates(0, Number.POSITIVE_INFINITY), /valores numéricos finitos/);
});
