import { ServiceCategoryStatus } from '../Enums/ServiceCategoryStatus';
import { DisplayOrder } from '../ValueObjects/DisplayOrder';
import { MediaReference } from '../ValueObjects/MediaReference';
import { ServiceCategoryId } from '../ValueObjects/ServiceCategoryId';
import { ServiceCategoryName } from '../ValueObjects/ServiceCategoryName';
import { ServiceId } from '../ValueObjects/ServiceId';

export class ServiceCategory {
  private _status = ServiceCategoryStatus.Inactive;
  private constructor(
    public readonly id: ServiceCategoryId,
    public readonly serviceId: ServiceId,
    private _name: ServiceCategoryName,
    private _description: string,
    private _referenceImage: MediaReference,
    private _order: DisplayOrder,
  ) {}
  public static create(id: ServiceCategoryId, serviceId: ServiceId, name: ServiceCategoryName,
    description: string | null | undefined, referenceImage: MediaReference, order: DisplayOrder): ServiceCategory {
    return new ServiceCategory(id, serviceId, name, description ?? '', referenceImage, order);
  }
  public get name(): ServiceCategoryName { return this._name; }
  public get description(): string { return this._description; }
  public get referenceImage(): MediaReference { return this._referenceImage; }
  public get order(): DisplayOrder { return this._order; }
  public get status(): ServiceCategoryStatus { return this._status; }
  public rename(name: ServiceCategoryName): void { this._name = name; }
  public changeDescription(description?: string | null): void { this._description = description ?? ''; }
  public changeReferenceImage(image: MediaReference): void { this._referenceImage = image; }
  public changeOrder(order: DisplayOrder): void { this._order = order; }
  public activate(): void { this._status = ServiceCategoryStatus.Active; }
  public deactivate(): void { this._status = ServiceCategoryStatus.Inactive; }
}
