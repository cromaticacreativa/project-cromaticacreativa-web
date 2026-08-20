import { CorporateClientPersistenceDto } from '../../../Portfolio.Commons/DTOs/CorporateClientPersistenceDto';
import { CorporateClient } from '../../../Portfolio.Domain/Aggregates/CorporateClient';
import { VisibilityStatus } from '../../../Portfolio.Domain/Enums/VisibilityStatus';
import { CorporateClientId } from '../../../Portfolio.Domain/ValueObjects/CorporateClientId';
import { CorporateClientName } from '../../../Portfolio.Domain/ValueObjects/CorporateClientName';
import { MediaReference } from '../../../Portfolio.Domain/ValueObjects/MediaReference';
import { CorporateClientPersistenceModel } from '../Models/CorporateClientPersistenceModel';

export class CorporateClientMapper {
  public static toDomain(model: CorporateClientPersistenceDto): CorporateClient {
    const client = CorporateClient.create(new CorporateClientId(model.id), new CorporateClientName(model.name),
      new MediaReference(model.logoReference));
    if (model.visibilityStatus === VisibilityStatus.Visible) client.show();
    else if (model.visibilityStatus === VisibilityStatus.Hidden) client.hide();
    else throw new Error(`El cliente corporativo '${model.id}' tiene la visibilidad no soportada '${model.visibilityStatus}'.`);
    return client;
  }

  public static toPersistence(client: CorporateClient): CorporateClientPersistenceModel {
    return Object.assign(new CorporateClientPersistenceModel(), {
      id: client.id.value,
      name: client.name.value,
      logoReference: client.logo.value,
      visibilityStatus: client.visibility,
      projects: [],
    });
  }
}
