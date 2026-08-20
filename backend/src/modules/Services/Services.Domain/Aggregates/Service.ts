import { ServiceStatus } from '../Enums/ServiceStatus';
import { DisplayOrder } from '../ValueObjects/DisplayOrder';
import { MediaReference } from '../ValueObjects/MediaReference';
import { ServiceId } from '../ValueObjects/ServiceId';
import { ServiceName } from '../ValueObjects/ServiceName';

export class Service {
  private _status = ServiceStatus.Inactive;
  private constructor(
    public readonly id: ServiceId,
    private _name: ServiceName,
    private _description: string,
    private _image: MediaReference,
    private _order: DisplayOrder,
  ) {}
  public static create(id: ServiceId, name: ServiceName, description: string | null | undefined,
    image: MediaReference, order: DisplayOrder): Service {
    return new Service(id, name, description ?? '', image, order);
  }
  public get name(): ServiceName { return this._name; }
  public get description(): string { return this._description; }
  public get image(): MediaReference { return this._image; }
  public get order(): DisplayOrder { return this._order; }
  public get status(): ServiceStatus { return this._status; }
  public rename(name: ServiceName): void { this._name = name; }
  public changeDescription(description?: string | null): void { this._description = description ?? ''; }
  public changeImage(image: MediaReference): void { this._image = image; }
  public changeOrder(order: DisplayOrder): void { this._order = order; }
  public activate(): void { this._status = ServiceStatus.Active; }
  public deactivate(): void { this._status = ServiceStatus.Inactive; }
}
