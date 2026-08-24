import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { ModificarInformacionDeContactoCommand } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/ModificarInformacionDeContacto/ModificarInformacionDeContactoCommand';
import { ModificarInformacionDeContactoCommandHandler } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/ModificarInformacionDeContacto/ModificarInformacionDeContactoCommandHandler';
import { ModificarUbicacionCommand } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/ModificarUbicacion/ModificarUbicacionCommand';
import { ModificarUbicacionCommandHandler } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/ModificarUbicacion/ModificarUbicacionCommandHandler';
import { ModificarTelefonoStrategy } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/ModificarTelefonoStrategy';
import { ModificarCorreoStrategy } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/ModificarCorreoStrategy';
import { ModificarRedSocialStrategy } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/ModificarRedSocialStrategy';
import { IChildActualReader } from '../src/modules/CompanyProfile/CompanyProfile.Application/Ports/IChildActualReader';
import { ICompanyProfileStateReader } from '../src/modules/CompanyProfile/CompanyProfile.Application/Ports/ICompanyProfileStateReader';
import { IModificarInformacionDeContactoStrategy } from '../src/modules/CompanyProfile/CompanyProfile.Application/Ports/IModificarInformacionDeContactoStrategy';
import { UbicacionRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/UbicacionRechazadaException';
import { InformacionDeContactoRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/InformacionDeContactoRechazadaException';
import { ValidadoraTelefono } from '../src/modules/CompanyProfile/CompanyProfile.Application/Validations/ValidadoraTelefono';
import { ValidadoraCorreo } from '../src/modules/CompanyProfile/CompanyProfile.Application/Validations/ValidadoraCorreo';
import { ValidadoraRedSocial } from '../src/modules/CompanyProfile/CompanyProfile.Application/Validations/ValidadoraRedSocial';
import { CompanyContactInformation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { Address } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/Address';
import { CompanyContactInformationId } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyContactInformationId';
import { CompanyLocation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyLocation';
import { EmailAddress } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/EmailAddress';
import { ExternalUrl } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/ExternalUrl';
import { GeoCoordinates } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/GeoCoordinates';
import { PhoneNumber } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/PhoneNumber';
import { SocialLink } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/SocialLink';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';

/** Reader configurable: reconstruye el aggregate y resuelve valores actuales por id. */
class ReaderFake implements ICompanyProfileStateReader, IChildActualReader {
  public llamadas = 0;
  public constructor(
    private readonly info: CompanyContactInformation | null,
    private readonly actuales: { telefono?: string; correo?: string; red?: string } = {},
  ) {}
  public async leerInformacionDeContacto(): Promise<CompanyContactInformation | null> { this.llamadas += 1; return this.info; }
  public async leerTelefonoActual(): Promise<string | null> { return this.actuales.telefono ?? null; }
  public async leerCorreoActual(): Promise<string | null> { return this.actuales.correo ?? null; }
  public async leerRedSocialActual(): Promise<string | null> { return this.actuales.red ?? null; }
}

function perfil(): CompanyContactInformation {
  return CompanyContactInformation.create(new CompanyContactInformationId(PROFILE_ID), new EmailAddress('recipient@example.com'));
}
function estrategias(reader: IChildActualReader): IModificarInformacionDeContactoStrategy[] {
  return [
    new ModificarTelefonoStrategy(new ValidadoraTelefono(), reader),
    new ModificarCorreoStrategy(new ValidadoraCorreo(), reader),
    new ModificarRedSocialStrategy(new ValidadoraRedSocial(), reader),
  ];
}

// ── Handler (orquestador) ───────────────────────────────────────────────────
test('el Handler carga el Aggregate una vez y resuelve la Strategy (sin switch)', async () => {
  const info = perfil();
  info.addPhone(new PhoneNumber('+584141234567'));
  const reader = new ReaderFake(info, { telefono: '+584141234567' });
  const handler = new ModificarInformacionDeContactoCommandHandler(reader, estrategias(reader));
  const r = await handler.execute(new ModificarInformacionDeContactoCommand({ tipo: 'TELEFONO', id: 'id-1', datos: { numero: '+58 0424 1112233' } }));
  assert.equal(reader.llamadas, 1);
  assert.deepEqual(r, { tipo: 'TELEFONO', datos: { numero: '+584241112233' } });

  const source = readFileSync(join('src', 'modules', 'CompanyProfile', 'CompanyProfile.Application', 'Commands', 'ModificarInformacionDeContacto', 'ModificarInformacionDeContactoCommandHandler.ts'), 'utf8');
  assert.doesNotMatch(source, /switch\s*\(/);
  assert.doesNotMatch(source, /entrada\.tipo\s*===/);
});

test('el Handler rechaza cuando ninguna Strategy soporta la entrada', async () => {
  const reader = new ReaderFake(perfil());
  const handler = new ModificarInformacionDeContactoCommandHandler(reader, estrategias(reader));
  await assert.rejects(handler.execute(new ModificarInformacionDeContactoCommand({ tipo: 'OTRO', id: 'x', datos: {} })), /No hay una estrategia/);
});

test('el Handler trata como error de configuración que más de una Strategy soporte la entrada', async () => {
  const reader = new ReaderFake(perfil(), { telefono: '+584141234567' });
  const dobles = [new ModificarTelefonoStrategy(new ValidadoraTelefono(), reader), new ModificarTelefonoStrategy(new ValidadoraTelefono(), reader)];
  const handler = new ModificarInformacionDeContactoCommandHandler(reader, dobles);
  await assert.rejects(handler.execute(new ModificarInformacionDeContactoCommand({ tipo: 'TELEFONO', id: 'x', datos: { numero: '+584121234567' } })), /Configuración inválida/);
});

// ── ModificarTelefonoStrategy ───────────────────────────────────────────────
test('ModificarTelefono: válido, sin +, plan inválido, duplicado y mismo valor permitido', async () => {
  const base = (): { info: CompanyContactInformation; reader: ReaderFake; strat: ModificarTelefonoStrategy } => {
    const info = perfil();
    info.addPhone(new PhoneNumber('+584141234567')); // el editado
    info.addPhone(new PhoneNumber('+584121234567')); // otro
    const reader = new ReaderFake(info, { telefono: '+584141234567' });
    return { info, reader, strat: new ModificarTelefonoStrategy(new ValidadoraTelefono(), reader) };
  };
  const entrada = (numero: unknown) => ({ tipo: 'TELEFONO', id: 'id-edit', datos: { numero } });

  const ok = base();
  const r = await ok.strat.ejecutar(ok.info, entrada('+58 0424 1112233'));
  assert.deepEqual(r, { tipo: 'TELEFONO', datos: { numero: '+584241112233' } });
  assert.deepEqual(ok.info.phones.map((p) => p.value).sort(), ['+584121234567', '+584241112233']);

  const sinMas = base();
  await assert.rejects(sinMas.strat.ejecutar(sinMas.info, entrada('04141234567')), /debe incluir el código de país comenzando con '\+'/);

  const plan = base();
  await assert.rejects(plan.strat.ejecutar(plan.info, entrada('+58 123')), /plan de numeración válido/);

  const dup = base();
  await assert.rejects(dup.strat.ejecutar(dup.info, entrada('+584121234567')), /Este número de teléfono ya está registrado/);

  const igual = base();
  const rIgual = await igual.strat.ejecutar(igual.info, entrada('+584141234567'));
  assert.equal(rIgual.datos['numero'], '+584141234567');
});

// ── ModificarCorreoStrategy ─────────────────────────────────────────────────
test('ModificarCorreo: válido, inválido, duplicado y mismo valor permitido', async () => {
  const base = () => {
    const info = perfil();
    info.addEmail(new EmailAddress('contacto@empresa.com'));
    info.addEmail(new EmailAddress('ventas@empresa.com'));
    const reader = new ReaderFake(info, { correo: 'contacto@empresa.com' });
    return { info, reader, strat: new ModificarCorreoStrategy(new ValidadoraCorreo(), reader) };
  };
  const entrada = (correo: unknown) => ({ tipo: 'CORREO', id: 'id-edit', datos: { correo } });

  const ok = base();
  const r = await ok.strat.ejecutar(ok.info, entrada('nuevo@empresa.com'));
  assert.deepEqual(r, { tipo: 'CORREO', datos: { correo: 'nuevo@empresa.com' } });

  const inv = base();
  await assert.rejects(inv.strat.ejecutar(inv.info, entrada('aaaa')), /formato válido/);

  const dup = base();
  await assert.rejects(dup.strat.ejecutar(dup.info, entrada('ventas@empresa.com')), /Este correo electrónico ya está registrado/);

  const igual = base();
  const rIgual = await igual.strat.ejecutar(igual.info, entrada('contacto@empresa.com'));
  assert.equal(rIgual.datos['correo'], 'contacto@empresa.com');
});

// ── ModificarRedSocialStrategy ──────────────────────────────────────────────
test('ModificarRedSocial: válido, URL inválida, múltiples errores, duplicado y misma red permitida', async () => {
  const base = () => {
    const info = perfil();
    info.addSocialLink(new SocialLink('Instagram', new ExternalUrl('https://instagram.com/a')));
    info.addSocialLink(new SocialLink('Facebook', new ExternalUrl('https://facebook.com/a')));
    const reader = new ReaderFake(info, { red: 'Instagram' });
    return { info, reader, strat: new ModificarRedSocialStrategy(new ValidadoraRedSocial(), reader) };
  };
  const entrada = (red: unknown, url: unknown) => ({ tipo: 'RED_SOCIAL', id: 'id-edit', datos: { red, url } });

  const ok = base();
  const r = await ok.strat.ejecutar(ok.info, entrada('Instagram', 'https://instagram.com/nuevo'));
  assert.deepEqual(r, { tipo: 'RED_SOCIAL', datos: { red: 'Instagram', url: 'https://instagram.com/nuevo' } });

  const url = base();
  await assert.rejects(url.strat.ejecutar(url.info, entrada('Instagram', 'hola')), /URL/);

  const multiple = base();
  await assert.rejects(multiple.strat.ejecutar(multiple.info, entrada('', 'hola')), (e: InformacionDeContactoRechazadaException) => {
    assert.deepEqual(e.errors.map((x) => x.field).sort(), ['red', 'url']);
    return true;
  });

  const dup = base();
  await assert.rejects(dup.strat.ejecutar(dup.info, entrada('Facebook', 'https://facebook.com/x')), /Ya existe una red social registrada/);

  const igual = base();
  const rIgual = await igual.strat.ejecutar(igual.info, entrada('instagram', 'https://instagram.com/mismo'));
  assert.equal(rIgual.datos['red'], 'instagram');
});

// ── HU25: ModificarUbicacion ────────────────────────────────────────────────
function conUbicacion(): CompanyContactInformation {
  const info = perfil();
  info.setLocation(new CompanyLocation(new Address('Av. Principal, Caracas'), new GeoCoordinates(10.48, -66.9)));
  return info;
}

test('ModificarUbicacion: modifica válido, completa campos ausentes con el actual', async () => {
  const info = conUbicacion();
  const handler = new ModificarUbicacionCommandHandler(new ReaderFake(info));
  const r = await handler.execute(new ModificarUbicacionCommand('Nueva dirección larga, Caracas', 10.5, undefined));
  assert.equal(r.direccion, 'Nueva dirección larga, Caracas');
  assert.equal(r.latitud, 10.5);
  assert.equal(r.longitud, -66.9); // ausente → conserva el actual
});

test('ModificarUbicacion: acumula errores (dirección corta + lat + long)', async () => {
  const info = conUbicacion();
  const handler = new ModificarUbicacionCommandHandler(new ReaderFake(info));
  await assert.rejects(
    handler.execute(new ModificarUbicacionCommand('a', 200, -500)),
    (e: UbicacionRechazadaException) => {
      assert.deepEqual(e.errors.map((x) => x.field), ['direccion', 'latitud', 'longitud']);
      return true;
    },
  );
});

test('ModificarUbicacion: rechaza si no hay ubicación registrada', async () => {
  const handler = new ModificarUbicacionCommandHandler(new ReaderFake(perfil()));
  await assert.rejects(handler.execute(new ModificarUbicacionCommand('Dirección válida X', 10, -66)), /No hay una ubicación registrada/);
});
