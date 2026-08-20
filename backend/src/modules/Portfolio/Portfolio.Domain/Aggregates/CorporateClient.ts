import { VisibilityStatus } from '../Enums/VisibilityStatus';
import { CorporateClientId } from '../ValueObjects/CorporateClientId';
import { CorporateClientName } from '../ValueObjects/CorporateClientName';
import { MediaReference } from '../ValueObjects/MediaReference';

export class CorporateClient {
  private constructor(
    public readonly id: CorporateClientId,
    private _name: CorporateClientName,
    private _logo: MediaReference,
    private _visibility: VisibilityStatus,
  ) {}

  public static create(id: CorporateClientId, name: CorporateClientName, logo: MediaReference): CorporateClient {
    return new CorporateClient(id, name, logo, VisibilityStatus.Hidden);
  }

  public get name(): CorporateClientName { return this._name; }
  public get logo(): MediaReference { return this._logo; }
  public get visibility(): VisibilityStatus { return this._visibility; }
  public rename(name: CorporateClientName): void { this._name = name; }
  public changeLogo(logo: MediaReference): void { this._logo = logo; }
  public show(): void { this._visibility = VisibilityStatus.Visible; }
  public hide(): void { this._visibility = VisibilityStatus.Hidden; }
}
