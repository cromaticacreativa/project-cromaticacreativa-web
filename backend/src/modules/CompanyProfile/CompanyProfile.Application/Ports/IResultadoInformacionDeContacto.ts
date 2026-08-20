export interface IResultadoInformacionDeContacto<TDatos extends object = Record<string, unknown>> {
  readonly tipo: string;
  readonly companyProfileId: string;
  readonly displayOrder: number;
  readonly datos: Readonly<TDatos>;
}
