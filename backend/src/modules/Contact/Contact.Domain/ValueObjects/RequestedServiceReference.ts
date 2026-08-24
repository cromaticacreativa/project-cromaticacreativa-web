import { UuidValueObject } from './Base/UuidValueObject';

export class RequestedServiceReference extends UuidValueObject {
  public constructor(value: string) { super(value, 'La referencia al servicio solicitado'); }
}
