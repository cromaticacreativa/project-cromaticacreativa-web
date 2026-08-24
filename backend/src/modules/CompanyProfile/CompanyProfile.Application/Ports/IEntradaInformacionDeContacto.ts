export interface IEntradaInformacionDeContacto {
  readonly tipo: string;
  readonly datos: Readonly<Record<string, unknown>>;
}
