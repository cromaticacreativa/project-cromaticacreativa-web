import assert from 'node:assert/strict';
import test from 'node:test';
import { CorporateClient } from '../src/modules/Portfolio/Portfolio.Domain/Aggregates/CorporateClient';
import { Project } from '../src/modules/Portfolio/Portfolio.Domain/Aggregates/Project';
import { MediaType } from '../src/modules/Portfolio/Portfolio.Domain/Enums/MediaType';
import { PublicationStatus } from '../src/modules/Portfolio/Portfolio.Domain/Enums/PublicationStatus';
import { VisibilityStatus } from '../src/modules/Portfolio/Portfolio.Domain/Enums/VisibilityStatus';
import { CalendarDate } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/CalendarDate';
import { CorporateClientId } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/CorporateClientId';
import { CorporateClientName } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/CorporateClientName';
import { DisplayOrder } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/DisplayOrder';
import { MediaReference } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/MediaReference';
import { ProjectCategoryReference } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectCategoryReference';
import { ProjectId } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectId';
import { ProjectMediaId } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectMediaId';
import { ProjectPeriod } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectPeriod';
import { ProjectServiceReference } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectServiceReference';
import { ProjectTitle } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectTitle';

const ids = {
  project: '11111111-1111-4111-8111-111111111111',
  service: '22222222-2222-4222-8222-222222222222',
  category: '33333333-3333-4333-8333-333333333333',
  media: '44444444-4444-4444-8444-444444444444',
  client: '55555555-5555-4555-8555-555555555555',
};

function project(title: ProjectTitle | null = null): Project {
  return Project.create({
    id: new ProjectId(ids.project),
    description: null,
    service: new ProjectServiceReference(ids.service),
    category: new ProjectCategoryReference(ids.category),
    period: new ProjectPeriod(new CalendarDate('2024-02-28'), new CalendarDate('2024-03-01')),
    order: new DisplayOrder(0),
    title,
  });
}

test('Project inicia Draft, exige título para publicar y puede volver a Draft', () => {
  const value = project();
  assert.equal(value.status, PublicationStatus.Draft);
  assert.throws(() => value.publish(), /título válido/);
  value.rename(new ProjectTitle(' Campaña '));
  value.publish();
  assert.equal(value.status, PublicationStatus.Published);
  value.unpublish();
  assert.equal(value.status, PublicationStatus.Draft);
});

test('Project cambia cliente, clasificación, período, descripción y orden', () => {
  const value = project();
  const clientId = new CorporateClientId(ids.client);
  const service = new ProjectServiceReference('66666666-6666-4666-8666-666666666666');
  const category = new ProjectCategoryReference('77777777-7777-4777-8777-777777777777');
  const period = new ProjectPeriod(new CalendarDate('2025-01-01'), new CalendarDate('2025-01-02'));
  value.assignCorporateClient(clientId);
  value.changeClassification(service, category);
  value.changePeriod(period);
  value.changeDescription('Descripción');
  value.changeOrder(new DisplayOrder(4));
  assert.ok(value.corporateClientId?.equals(clientId));
  assert.ok(value.service.equals(service));
  assert.ok(value.category.equals(category));
  assert.ok(value.period.equals(period));
  assert.equal(value.description, 'Descripción');
  assert.equal(value.order.value, 4);
  value.removeCorporateClient();
  value.changeDescription(null);
  assert.equal(value.corporateClientId, null);
  assert.equal(value.description, '');
});

test('CalendarDate conserva semántica DateOnly, valida fechas y deriva días', () => {
  const period = new ProjectPeriod(new CalendarDate('2024-02-28'), new CalendarDate('2024-03-01'));
  assert.equal(period.totalDays, 2);
  assert.ok(period.equals(new ProjectPeriod(new CalendarDate('2024-02-28'), new CalendarDate('2024-03-01'))));
  assert.equal(new CalendarDate('0001-01-01').value, '0001-01-01');
  assert.throws(() => new CalendarDate('0000-01-01'), /no es válida/);
  assert.throws(() => new CalendarDate('2023-02-29'), /no es válida/);
  assert.throws(() => new ProjectPeriod(new CalendarDate('2024-03-02'), new CalendarDate('2024-03-01')), /no puede/);
});

test('Project controla unicidad, actualización, portada y eliminación de media', () => {
  const value = project();
  const mediaId = new ProjectMediaId(ids.media);
  value.addMedia(mediaId, new MediaReference('asset-1'), MediaType.Image, new DisplayOrder(0));
  assert.throws(() => value.addMedia(new ProjectMediaId(ids.media), new MediaReference('asset-2'),
    MediaType.Video, new DisplayOrder(1)), /ya está asociado/);
  const missingMediaId = new ProjectMediaId('88888888-8888-4888-8888-888888888888');
  assert.throws(() => value.updateMedia(missingMediaId, new MediaReference('x'),
    MediaType.Image, new DisplayOrder(0)), /no pertenece/);
  assert.throws(() => value.setCoverMedia(missingMediaId), /no pertenece/);
  value.updateMedia(mediaId, new MediaReference('asset-2'), MediaType.Video, new DisplayOrder(2));
  value.changeMediaOrder(mediaId, new DisplayOrder(3));
  value.setCoverMedia(new ProjectMediaId(ids.media));
  assert.ok(value.coverMediaId?.equals(mediaId));
  value.clearCoverMedia();
  assert.equal(value.coverMediaId, null);
  value.setCoverMedia(mediaId);
  value.removeMedia(mediaId);
  assert.equal(value.coverMediaId, null);
  assert.equal(value.media.length, 0);
});

test('CorporateClient inicia Hidden y permite renombrar, cambiar logo, mostrar y ocultar', () => {
  const client = CorporateClient.create(new CorporateClientId(ids.client),
    new CorporateClientName(' Anterior '), new MediaReference('logo-1'));
  assert.equal(client.visibility, VisibilityStatus.Hidden);
  client.rename(new CorporateClientName('Nuevo'));
  client.changeLogo(new MediaReference('logo-2'));
  client.show();
  assert.equal(client.name.value, 'Nuevo');
  assert.equal(client.logo.value, 'logo-2');
  assert.equal(client.visibility, VisibilityStatus.Visible);
  client.hide();
  assert.equal(client.visibility, VisibilityStatus.Hidden);
});

test('IDs y Value Objects escalares tienen igualdad por valor y protegen invariantes', () => {
  assert.ok(new ProjectId(ids.project).equals(new ProjectId(ids.project)));
  assert.ok(!new ProjectId(ids.project).equals(new ProjectId('99999999-9999-4999-8999-999999999999')));
  assert.throws(() => new ProjectId('00000000-0000-0000-0000-000000000000'), /UUID/);
  assert.throws(() => new ProjectId('not-a-uuid'), /UUID/);
  assert.throws(() => new ProjectTitle('   '), /vacío/);
  assert.throws(() => new DisplayOrder(-1), /no negativo/);
});
