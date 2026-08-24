export interface IResultadoInformacionDeContacto<TDatos extends object = Record<string, unknown>> {
  readonly tipo: string;
  readonly datos: Readonly<TDatos>;
}

/** Resultado de los medios públicos que ocupan una posición en una colección. */
export interface IResultadoInformacionDeContactoOrdenado<
  TDatos extends object = Record<string, unknown>,
> extends IResultadoInformacionDeContacto<TDatos> {
  readonly companyProfileId: string;
  readonly displayOrder: number;
}

/** Resultado del correo único que recibe las solicitudes del formulario. */
export interface IResultadoCorreoReceptor
extends IResultadoInformacionDeContacto<{ correo: string }> {
  readonly tipo: 'CORREO_RECEPTOR';
}
