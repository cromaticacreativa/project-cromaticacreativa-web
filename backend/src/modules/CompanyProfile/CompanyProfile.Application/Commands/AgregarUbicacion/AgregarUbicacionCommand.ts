export class AgregarUbicacionCommand {
  public constructor(
    public readonly direccion: string,
    public readonly latitud: number,
    public readonly longitud: number,
  ) {}
}
