import { InvalidMediaTypeException } from '../Exceptions/InvalidMediaTypeException';

export enum MediaType {
  Image = 'IMAGE',
  Video = 'VIDEO',
}

export function assertMediaType(value: MediaType): void {
  if (!Object.values(MediaType).includes(value)) {
    throw new InvalidMediaTypeException(String(value));
  }
}
