export interface IValidadora<TEntrada, TResultado> {
  validar(valor: TEntrada): TResultado;
}
