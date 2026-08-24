import { ServicePersistenceDto } from '../../../Services.Commons/DTOs/ServicePersistenceDto';
import { Service } from '../../../Services.Domain/Aggregates/Service';
import { ServiceStatus } from '../../../Services.Domain/Enums/ServiceStatus';
import { DisplayOrder } from '../../../Services.Domain/ValueObjects/DisplayOrder';
import { MediaReference } from '../../../Services.Domain/ValueObjects/MediaReference';
import { ServiceId } from '../../../Services.Domain/ValueObjects/ServiceId';
import { ServiceName } from '../../../Services.Domain/ValueObjects/ServiceName';
import { ServicePersistenceModel } from '../Models/ServicePersistenceModel';

export class ServiceMapper {
  public static toDomain(model: ServicePersistenceDto): Service {
    const service = Service.create(new ServiceId(model.id), new ServiceName(model.name), model.description,
      new MediaReference(model.imageReference), new DisplayOrder(model.displayOrder));
    if (model.status === ServiceStatus.Active) service.activate();
    else if (model.status === ServiceStatus.Inactive) service.deactivate();
    else throw new Error(`El servicio '${model.id}' tiene el estado no soportado '${model.status}'.`);
    return service;
  }

  public static toPersistence(service: Service): ServicePersistenceModel {
    return Object.assign(new ServicePersistenceModel(), {
      id: service.id.value,
      name: service.name.value,
      description: service.description,
      imageReference: service.image.value,
      status: service.status,
      displayOrder: service.order.value,
      categories: [],
    });
  }
}
