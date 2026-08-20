import assert from 'node:assert/strict';
import test from 'node:test';
import { Service } from '../src/modules/Services/Services.Domain/Aggregates/Service';
import { ServiceCategory } from '../src/modules/Services/Services.Domain/Aggregates/ServiceCategory';
import { ServiceCategoryStatus } from '../src/modules/Services/Services.Domain/Enums/ServiceCategoryStatus';
import { ServiceStatus } from '../src/modules/Services/Services.Domain/Enums/ServiceStatus';
import { DisplayOrder } from '../src/modules/Services/Services.Domain/ValueObjects/DisplayOrder';
import { MediaReference } from '../src/modules/Services/Services.Domain/ValueObjects/MediaReference';
import { ServiceCategoryId } from '../src/modules/Services/Services.Domain/ValueObjects/ServiceCategoryId';
import { ServiceCategoryName } from '../src/modules/Services/Services.Domain/ValueObjects/ServiceCategoryName';
import { ServiceId } from '../src/modules/Services/Services.Domain/ValueObjects/ServiceId';
import { ServiceName } from '../src/modules/Services/Services.Domain/ValueObjects/ServiceName';

const serviceId = '11111111-1111-4111-8111-111111111111';

test('Service inicia Inactive y permite cambiar propiedades y estado', () => {
  const service = Service.create(new ServiceId(serviceId), new ServiceName('Diseño'), null,
    new MediaReference('image'), new DisplayOrder(0));
  assert.equal(service.status, ServiceStatus.Inactive);
  service.rename(new ServiceName('Marca'));
  service.changeDescription('descripción');
  service.changeImage(new MediaReference('next'));
  service.changeOrder(new DisplayOrder(2));
  service.activate();
  assert.equal(service.status, ServiceStatus.Active);
  assert.equal(service.name.value, 'Marca');
  assert.equal(service.order.value, 2);
  service.deactivate();
  assert.equal(service.status, ServiceStatus.Inactive);
});

test('ServiceCategory conserva ServiceId, inicia Inactive y permite cambios', () => {
  const category = ServiceCategory.create(new ServiceCategoryId('22222222-2222-4222-8222-222222222222'),
    new ServiceId(serviceId), new ServiceCategoryName('Logo'), null,
    new MediaReference('reference'), new DisplayOrder(0));
  assert.equal(category.status, ServiceCategoryStatus.Inactive);
  category.rename(new ServiceCategoryName('Identidad'));
  category.changeDescription('descripción');
  category.changeReferenceImage(new MediaReference('new'));
  category.changeOrder(new DisplayOrder(3));
  category.activate();
  assert.equal(category.status, ServiceCategoryStatus.Active);
  assert.equal(category.serviceId.value, serviceId);
  category.deactivate();
  assert.equal(category.status, ServiceCategoryStatus.Inactive);
});

test('Value Objects de Services son locales, válidos e iguales por valor', () => {
  assert.ok(new ServiceId(serviceId).equals(new ServiceId(serviceId)));
  assert.ok(new ServiceName(' Diseño ').equals(new ServiceName('Diseño')));
  assert.throws(() => new ServiceId('00000000-0000-0000-0000-000000000000'), /UUID/);
  assert.throws(() => new ServiceCategoryName(' '), /vacío/);
  assert.throws(() => new DisplayOrder(-1), /no negativo/);
});
