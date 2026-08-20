import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { AgregarUbicacionCommand } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/AgregarUbicacion/AgregarUbicacionCommand';
import { AgregarUbicacionCommandHandler } from '../src/modules/CompanyProfile/CompanyProfile.Application/Commands/AgregarUbicacion/AgregarUbicacionCommandHandler';
import { UbicacionRechazadaException } from '../src/modules/CompanyProfile/CompanyProfile.Application/Exceptions/UbicacionRechazadaException';
import { ICompanyProfileStateReader } from '../src/modules/CompanyProfile/CompanyProfile.Application/Ports/ICompanyProfileStateReader';
import { CompanyContactInformation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { Address } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/Address';
import { CompanyContactInformationId } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyContactInformationId';
import { CompanyLocation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyLocation';
import { EmailAddress } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/EmailAddress';
import { GeoCoordinates } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/GeoCoordinates';
import { AgregarUbicacionMapper } from '../src/modules/CompanyProfile/CompanyProfile.Presentation/Mappers/AgregarUbicacionMapper';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';

function informacion(): CompanyContactInformation {
  return CompanyContactInformation.create(
    new CompanyContactInformationId(PROFILE_ID),
    new EmailAddress('recipient@example.com'),
  );
}

class ReaderContador implements ICompanyProfileStateReader {
  public llamadas = 0;
  public constructor(private readonly info: CompanyContactInformation | null) {}
  public async leerInformacionDeContacto(): Promise<CompanyContactInformation | null> {
    this.llamadas += 1;
    return this.info;
  }
}

function handler(info: CompanyContactInformation | null): { handler: AgregarUbicacionCommandHandler; reader: ReaderContador } {
  const reader = new ReaderContador(info);
  return { handler: new AgregarUbicacionCommandHandler(reader), reader };
}

test('agrega una ubicación válida y devuelve el resultado canónico', async () => {
  const { handler: sut, reader } = handler(informacion());
  const resultado = await sut.execute(new AgregarUbicacionCommand('Av. Principal, Caracas, Venezuela', 10.4806, -66.9036));
  assert.equal(reader.llamadas, 1);
  assert.deepEqual(resultado, {
    companyProfileId: PROFILE_ID,
    direccion: 'Av. Principal, Caracas, Venezuela',
    latitud: 10.4806,
    longitud: -66.9036,
  });
});

test('canonicaliza la dirección (trim) mediante el Value Object Address', async () => {
  const { handler: sut } = handler(informacion());
  const resultado = await sut.execute(new AgregarUbicacionCommand('  Av. Principal, Caracas  ', 10, -66));
  assert.equal(resultado.direccion, 'Av. Principal, Caracas');
});

test('rechaza una dirección vacía', async () => {
  for (const direccion of ['', '   ']) {
    const { handler: sut } = handler(informacion());
    await assert.rejects(sut.execute(new AgregarUbicacionCommand(direccion, 10, -66)), UbicacionRechazadaException);
  }
});

test('rechaza coordenadas fuera de rango o no finitas', async () => {
  const invalidas: Array<[number, number]> = [
    [-91, 0], [91, 0], [0, -181], [0, 181], [Number.NaN, 0], [0, Number.POSITIVE_INFINITY],
  ];
  for (const [lat, lon] of invalidas) {
    const { handler: sut } = handler(informacion());
    await assert.rejects(sut.execute(new AgregarUbicacionCommand('Dirección', lat, lon)), UbicacionRechazadaException);
  }
});

test('rechaza cuando ya existe una ubicación (HU24 no sobrescribe)', async () => {
  const info = informacion();
  info.setLocation(new CompanyLocation(new Address('Existente'), new GeoCoordinates(1, 2)));
  const { handler: sut } = handler(info);
  await assert.rejects(
    sut.execute(new AgregarUbicacionCommand('Nueva', 3, 4)),
    /Ya existe una ubicación registrada/,
  );
  // La ubicación previa no se sobrescribe.
  assert.equal(info.location?.address.value, 'Existente');
});

test('acumula los errores de dirección, latitud y longitud de la misma operación', async () => {
  const { handler: sut } = handler(informacion());
  await assert.rejects(
    sut.execute(new AgregarUbicacionCommand('', 200, -500)),
    (error: UbicacionRechazadaException) => {
      assert.ok(error instanceof UbicacionRechazadaException);
      assert.equal(error.esConflicto, false);
      assert.deepEqual(error.errors.map((e) => e.field), ['direccion', 'latitud', 'longitud']);
      assert.match(error.errors[0]!.message, /dirección no puede estar vacía/);
      assert.match(error.errors[1]!.message, /latitud debe estar entre -90 y 90/);
      assert.match(error.errors[2]!.message, /longitud debe estar entre -180 y 180/);
      assert.equal(error.message, 'Hay errores de validación.');
      return true;
    },
  );
});

test('acumula solo los campos inválidos (latitud + longitud, dirección válida)', async () => {
  const { handler: sut } = handler(informacion());
  await assert.rejects(
    sut.execute(new AgregarUbicacionCommand('Av. Principal', 200, -500)),
    (error: UbicacionRechazadaException) => {
      assert.deepEqual(error.errors.map((e) => e.field), ['latitud', 'longitud']);
      return true;
    },
  );
});

test('un único campo inválido produce un único error con ese mensaje', async () => {
  const { handler: sut } = handler(informacion());
  await assert.rejects(
    sut.execute(new AgregarUbicacionCommand('Av. Principal', 200, -66)),
    (error: UbicacionRechazadaException) => {
      assert.deepEqual(error.errors.map((e) => e.field), ['latitud']);
      assert.equal(error.message, 'La latitud debe estar entre -90 y 90.');
      return true;
    },
  );
});

test('rechaza cuando el CompanyProfile no ha sido inicializado', async () => {
  const { handler: sut } = handler(null);
  await assert.rejects(sut.execute(new AgregarUbicacionCommand('Dirección', 10, -66)), /no ha sido inicializada/);
});

test('el caso de uso de ubicación no dispone de ningún puerto de escritura (escritor único)', () => {
  const application = join('src', 'modules', 'CompanyProfile', 'CompanyProfile.Application');
  const fuentes = [
    ...readdirSync(join(application, 'Commands', 'AgregarUbicacion')).map((f) => readFileSync(join(application, 'Commands', 'AgregarUbicacion', f), 'utf8')),
    readFileSync(join(application, 'Exceptions', 'UbicacionRechazadaException.ts'), 'utf8'),
    readFileSync(join(application, 'Ports', 'IResultadoUbicacion.ts'), 'utf8'),
  ];
  const escrituras = /(save|insert|update|delete|remove|persist)\s*\(|typeorm|Repository|EntityManager/i;
  for (const source of fuentes) assert.doesNotMatch(source, escrituras);
});

test('el Mapper traduce el payload de Directus a AgregarUbicacionCommand', () => {
  const command = AgregarUbicacionMapper.toCommand({
    collection: 'location',
    payload: { address: '  Av. Principal, Caracas  ', latitude: 10.4806, longitude: -66.9036, company_profile_id: 'ignorado' },
  });
  assert.equal(command.direccion, '  Av. Principal, Caracas  ');
  assert.equal(command.latitud, 10.4806);
  assert.equal(command.longitud, -66.9036);
});

test('el Mapper traduce el resultado canónico al payload de Directus con el id del backend', () => {
  const respuesta = AgregarUbicacionMapper.toResponse({
    companyProfileId: PROFILE_ID,
    direccion: 'Av. Principal, Caracas, Venezuela',
    latitud: 10.4806,
    longitud: -66.9036,
  });
  assert.deepEqual(respuesta.payload, {
    company_profile_id: PROFILE_ID,
    address: 'Av. Principal, Caracas, Venezuela',
    latitude: 10.4806,
    longitude: -66.9036,
  });
});
