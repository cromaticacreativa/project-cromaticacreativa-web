export abstract class ScalarValueObject<T extends string | number> {
  protected constructor(public readonly value: T) {}

  public equals(other: unknown): boolean {
    return (
      other !== null
      && other !== undefined
      && other.constructor === this.constructor
      && (other as ScalarValueObject<T>).value === this.value
    );
  }

  public toString(): string {
    return String(this.value);
  }
}
