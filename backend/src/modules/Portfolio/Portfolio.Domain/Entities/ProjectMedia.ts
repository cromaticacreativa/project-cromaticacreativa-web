import { assertMediaType, MediaType } from '../Enums/MediaType';
import { DisplayOrder } from '../ValueObjects/DisplayOrder';
import { MediaReference } from '../ValueObjects/MediaReference';
import { ProjectMediaId } from '../ValueObjects/ProjectMediaId';

export class ProjectMedia {
  public constructor(
    public readonly id: ProjectMediaId,
    public readonly reference: MediaReference,
    public readonly type: MediaType,
    public readonly order: DisplayOrder,
  ) {
    assertMediaType(type);
  }

  public withChanges(reference: MediaReference, type: MediaType, order: DisplayOrder): ProjectMedia {
    return new ProjectMedia(this.id, reference, type, order);
  }

  public withOrder(order: DisplayOrder): ProjectMedia {
    return new ProjectMedia(this.id, this.reference, this.type, order);
  }
}
