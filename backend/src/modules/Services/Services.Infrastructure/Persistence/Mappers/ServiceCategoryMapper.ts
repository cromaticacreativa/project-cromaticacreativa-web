import { ServiceCategoryPersistenceDto } from '../../../Services.Commons/DTOs/ServiceCategoryPersistenceDto';
import { ServiceCategory } from '../../../Services.Domain/Aggregates/ServiceCategory';
import { ServiceCategoryStatus } from '../../../Services.Domain/Enums/ServiceCategoryStatus';
import { DisplayOrder } from '../../../Services.Domain/ValueObjects/DisplayOrder';
import { MediaReference } from '../../../Services.Domain/ValueObjects/MediaReference';
import { ServiceCategoryId } from '../../../Services.Domain/ValueObjects/ServiceCategoryId';
import { ServiceCategoryName } from '../../../Services.Domain/ValueObjects/ServiceCategoryName';
import { ServiceId } from '../../../Services.Domain/ValueObjects/ServiceId';
import { ServiceCategoryPersistenceModel } from '../Models/ServiceCategoryPersistenceModel';

export class ServiceCategoryMapper {
  public static toDomain(model: ServiceCategoryPersistenceDto): ServiceCategory {
    const category = ServiceCategory.create(new ServiceCategoryId(model.id), new ServiceId(model.serviceId),
      new ServiceCategoryName(model.name), model.description, new MediaReference(model.referenceImage),
      new DisplayOrder(model.displayOrder));
    if (model.status === ServiceCategoryStatus.Active) category.activate();
    else if (model.status === ServiceCategoryStatus.Inactive) category.deactivate();
    else throw new Error(`La categoría '${model.id}' tiene el estado no soportado '${model.status}'.`);
    return category;
  }

  public static toPersistence(category: ServiceCategory): ServiceCategoryPersistenceModel {
    return Object.assign(new ServiceCategoryPersistenceModel(), {
      id: category.id.value,
      serviceId: category.serviceId.value,
      name: category.name.value,
      description: category.description,
      referenceImage: category.referenceImage.value,
      status: category.status,
      displayOrder: category.order.value,
    });
  }
}
