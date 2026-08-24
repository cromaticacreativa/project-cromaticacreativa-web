/**
 * Lee el valor único ACTUAL de un child por su id persistente, para poder
 * modificar el elemento correcto sin que el Domain conozca ids (los VOs son por
 * valor). El id se resuelve a su valor único (número/correo/red) en Infrastructure;
 * el Aggregate opera después por valor con `changePhone/changeEmail/changeSocialLink`.
 * Es solo lectura: la escritura final la hace el CMS externo.
 */
export interface IChildActualReader {
  leerTelefonoActual(id: string): Promise<string | null>;
  leerCorreoActual(id: string): Promise<string | null>;
  leerRedSocialActual(id: string): Promise<string | null>;
}

export const CHILD_ACTUAL_READER = Symbol('IChildActualReader');
