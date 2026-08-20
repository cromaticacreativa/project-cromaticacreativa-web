import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { AgregarInformacionDeContactoCommand } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/AgregarInformacionDeContacto/AgregarInformacionDeContactoCommand';
import { AgregarInformacionDeContactoCommandHandler } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/AgregarInformacionDeContacto/AgregarInformacionDeContactoCommandHandler';
import { AgregarCorreoStrategy, TIPO_CORREO } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/AgregarCorreoStrategy';
import { AgregarRedSocialStrategy, TIPO_RED_SOCIAL } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/AgregarRedSocialStrategy';
import { AgregarTelefonoStrategy, TIPO_TELEFONO } from '../src/modules/CompanyProfile/CompanyProfile.Application/Strategies/AgregarTelefonoStrategy';
import { IAgregarInformacionDeContactoStrategy } from '../src/modules/CompanyProfile/CompanyProfile.Application/Ports/IAgregarInformacionDeContactoStrategy';
import { IEntradaInformacionDeContacto } from '../src/modules/CompanyProfile/CompanyProfile.Application/Ports/IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContacto } from '../src/modules/CompanyProfile/CompanyProfile.Application/Ports/IResultadoInformacionDeContacto';
import { ICompanyProfileStateReader } from '../src/modules/CompanyProfile/CompanyProfile.Application/Ports/ICompanyProfileStateReader';
import { ValidadoraTelefono } from '../src/modules/CompanyProfile/CompanyProfile.Application/Validations/ValidadoraTelefono';
import { CompanyContactInformation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { CompanyContactInformationId } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyContactInformationId';
import { EmailAddress } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/EmailAddress';
import { PhoneNumber } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/PhoneNumber';
import { AgregarInformacionDeContactoMapper } from '../src/modules/CompanyProfile/CompanyProfile.Presentation/Mappers/AgregarInformacionDeContactoMapper';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';

function informacion(): CompanyContactInformation {
  return CompanyContactInformation.create(
    new CompanyContactInformationId(PROFILE_ID),
    new EmailAddress('recipient@example.com'),
  );
}

function estrategiasReales(): IAgregarInformacionDeContactoStrategy[] {
  return [new AgregarTelefonoStrategy(new ValidadoraTelefono()), new AgregarCorreoStrategy(), new AgregarRedSocialStrategy()];
}

class ReaderContador implements ICompanyProfileStateReader {
  public llamadas = 0;
  public constructor(private readonly info: CompanyContactInformation | null) {}
  public async leerInformacionDeContacto(): Promise<CompanyContactInformation | null> {
    this.llamadas += 1;
    return this.info;
  }
}

function handler(
  info: CompanyContactInformation | null,
  estrategias: IAgregarInformacionDeContactoStrategy[] = estrategiasReales(),
): { handler: AgregarInformacionDeContactoCommandHandler; reader: ReaderContador } {
  const reader = new ReaderContador(info);
  return { handler: new AgregarInformacionDeContactoCommandHandler(reader, estrategias), reader };
}

function comando(entrada: IEntradaInformacionDeContacto): AgregarInformacionDeContactoCommand {
  return new AgregarInformacionDeContactoCommand(entrada);
}

test('el Handler carga el Aggregate una sola vez y delega en la Strategy resuelta', async () => {
  const { handler: sut, reader } = handler(informacion());
  const resultado = await sut.execute(comando({ tipo: TIPO_TELEFONO, datos: { numero: '+58 0412 1234567' } }));
  assert.equal(reader.llamadas, 1);
  assert.deepEqual(resultado, {
    tipo: TIPO_TELEFONO,
    companyProfileId: PROFILE_ID,
    displayOrder: 0,
    datos: { numero: '+584121234567' },
  });
});

test('el Handler orquesta cada medio a través de su Strategy (teléfono, correo, red)', async () => {
  const info = informacion();
  info.addPhone(new PhoneNumber('+584141234567'));
  const { handler: sut } = handler(info);

  const telefono = await sut.execute(comando({ tipo: TIPO_TELEFONO, datos: { numero: '+58 0412 1234567' } }));
  assert.equal(telefono.displayOrder, 1);

  const correo = await sut.execute(comando({ tipo: TIPO_CORREO, datos: { correo: 'ventas@example.com' } }));
  assert.equal(correo.datos['correo'], 'ventas@example.com');

  const red = await sut.execute(comando({ tipo: TIPO_RED_SOCIAL, datos: { red: 'WhatsApp', url: 'https://wa.me/584121234567' } }));
  assert.equal(red.datos['red'], 'WhatsApp');
});

test('el Handler rechaza cuando el perfil no ha sido inicializado', async () => {
  const { handler: sut } = handler(null);
  await assert.rejects(
    sut.execute(comando({ tipo: TIPO_TELEFONO, datos: { numero: '+584121234567' } })),
    /no ha sido inicializada/,
  );
});

test('el Handler propaga el rechazo de negocio de la Strategy (duplicado)', async () => {
  const info = informacion();
  info.addPhone(new PhoneNumber('+584121234567'));
  const { handler: sut } = handler(info);
  await assert.rejects(
    sut.execute(comando({ tipo: TIPO_TELEFONO, datos: { numero: '+58 0412 1234567' } })),
    /ya está registrado/,
  );
});

test('el resolver rechaza cuando ninguna Strategy soporta la entrada', async () => {
  const soloCorreo: IAgregarInformacionDeContactoStrategy[] = [new AgregarCorreoStrategy()];
  const { handler: sut } = handler(informacion(), soloCorreo);
  await assert.rejects(
    sut.execute(comando({ tipo: TIPO_TELEFONO, datos: { numero: '+584121234567' } })),
    /No hay una estrategia que soporte/,
  );
});

test('el resolver trata como error de configuración que más de una Strategy soporte la entrada', async () => {
  const dosCorreos: IAgregarInformacionDeContactoStrategy[] = [new AgregarCorreoStrategy(), new AgregarCorreoStrategy()];
  const { handler: sut } = handler(informacion(), dosCorreos);
  await assert.rejects(
    sut.execute(comando({ tipo: TIPO_CORREO, datos: { correo: 'a@b.com' } })),
    /Configuración inválida/,
  );
});

test('OCP: un medio totalmente nuevo se soporta sin modificar el Handler ni un catálogo central', async () => {
  const TIPO_OTRO_MEDIO_TEST = 'OTRO_MEDIO_TEST';

  // Ninguna Strategy productiva conoce este tipo: es genuinamente nuevo.
  for (const estrategia of estrategiasReales()) {
    assert.equal(estrategia.soporta({ tipo: TIPO_OTRO_MEDIO_TEST, datos: {} }), false);
  }

  const marcador = { usado: false };
  const nuevaEstrategia: IAgregarInformacionDeContactoStrategy = {
    soporta: (entrada) => entrada.tipo === TIPO_OTRO_MEDIO_TEST,
    ejecutar: (info, entrada): IResultadoInformacionDeContacto => {
      marcador.usado = true;
      return {
        tipo: entrada.tipo,
        companyProfileId: info.id.value,
        displayOrder: 0,
        datos: { ...entrada.datos },
      };
    },
  };

  // El mismo Handler, sin cambios, enruta a la Strategy nueva.
  const { handler: sut } = handler(informacion(), [...estrategiasReales(), nuevaEstrategia]);
  const resultado = await sut.execute(comando({ tipo: TIPO_OTRO_MEDIO_TEST, datos: { valor: 'x' } }));
  assert.equal(marcador.usado, true);
  assert.equal(resultado.tipo, TIPO_OTRO_MEDIO_TEST);
  assert.equal(resultado.datos['valor'], 'x');
});

test('el Handler no contiene selección por tipo (switch/if) — la resolución es polimórfica', () => {
  const source = readFileSync(
    join('src', 'modules', 'CompanyProfile', 'CompanyProfile.Application', 'Commands', 'AgregarInformacionDeContacto', 'AgregarInformacionDeContactoCommandHandler.ts'),
    'utf8',
  );
  assert.doesNotMatch(source, /switch\s*\(/);
  assert.doesNotMatch(source, /entrada\.tipo\s*===/);
});

test('el caso de uso no dispone de ningún puerto de escritura (escritor único)', () => {
  const base = join('src', 'modules', 'CompanyProfile');
  const application = join(base, 'CompanyProfile.Application');
  const fuentes: string[] = [
    ...leerTs(join(application, 'Ports')),
    ...leerTs(join(application, 'Commands', 'AgregarInformacionDeContacto')),
    ...leerTs(join(application, 'Strategies')),
    ...leerTs(join(application, 'Validations')),
  ];
  const escrituras = /(save|insert|update|delete|remove|persist)\s*\(/i;
  for (const source of fuentes) assert.doesNotMatch(source, escrituras);

  const reader = readFileSync(join(base, 'CompanyProfile.Infrastructure/Adapters/CompanyProfileStateReader.ts'), 'utf8');
  assert.match(reader, /findOne/);
  assert.doesNotMatch(reader, escrituras);
});

test('el Mapper traduce colecciones de Directus a la entrada abierta del caso de uso', () => {
  const telefono = AgregarInformacionDeContactoMapper.toCommand({ collection: 'phone', payload: { number: ' +58 0412 1234567 ' } });
  assert.deepEqual(telefono.entrada, { tipo: TIPO_TELEFONO, datos: { numero: ' +58 0412 1234567 ' } });

  const correo = AgregarInformacionDeContactoMapper.toCommand({ collection: 'email', payload: { address: 'a@b.com' } });
  assert.deepEqual(correo.entrada, { tipo: TIPO_CORREO, datos: { correo: 'a@b.com' } });

  const social = AgregarInformacionDeContactoMapper.toCommand({
    collection: 'social_link',
    payload: { network: 'WhatsApp', url: 'https://wa.me/584121234567' },
  });
  assert.deepEqual(social.entrada, {
    tipo: TIPO_RED_SOCIAL,
    datos: { red: 'WhatsApp', url: 'https://wa.me/584121234567' },
  });

  assert.throws(() => AgregarInformacionDeContactoMapper.toCommand({ collection: 'project', payload: {} }), /no forma parte de HU22/);
});

test('el Mapper traduce el resultado canónico al payload de Directus', () => {
  const respuesta = AgregarInformacionDeContactoMapper.toResponse({
    tipo: TIPO_TELEFONO,
    companyProfileId: PROFILE_ID,
    displayOrder: 2,
    datos: { numero: '+584121234567' },
  });
  assert.deepEqual(respuesta.payload, {
    company_profile_id: PROFILE_ID,
    number: '+584121234567',
    display_order: 2,
  });
});

function leerTs(directory: string): string[] {
  return readdirSync(directory)
    .filter((entry) => entry.endsWith('.ts'))
    .map((entry) => readFileSync(join(directory, entry), 'utf8'));
}
