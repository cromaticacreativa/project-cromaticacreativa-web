import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InformacionDeContactoRechazadaException } from '../../Exceptions/InformacionDeContactoRechazadaException';
import {
  COMPANY_PROFILE_STATE_READER,
  ICompanyProfileStateReader,
} from '../../Ports/ICompanyProfileStateReader';
import {
  IEntradaModificacionDeContacto,
  IModificarInformacionDeContactoStrategy,
  MODIFICAR_INFORMACION_DE_CONTACTO_STRATEGIES,
} from '../../Ports/IModificarInformacionDeContactoStrategy';
import { IResultadoInformacionDeContacto } from '../../Ports/IResultadoInformacionDeContacto';
import { ModificarInformacionDeContactoCommand } from './ModificarInformacionDeContactoCommand';

/**
 * Orquestador de HU23: carga el Aggregate una vez, resuelve polimórficamente la
 * Strategy compatible y la ejecuta. No contiene `switch`/`if` por tipo, ni
 * validaciones ni Value Objects: eso vive en las Strategies/Validadoras.
 */
@CommandHandler(ModificarInformacionDeContactoCommand)
export class ModificarInformacionDeContactoCommandHandler
implements ICommandHandler<ModificarInformacionDeContactoCommand, IResultadoInformacionDeContacto> {
  public constructor(
    @Inject(COMPANY_PROFILE_STATE_READER) private readonly estado: ICompanyProfileStateReader,
    @Inject(MODIFICAR_INFORMACION_DE_CONTACTO_STRATEGIES)
    private readonly estrategias: readonly IModificarInformacionDeContactoStrategy[],
  ) {}

  public async execute(
    command: ModificarInformacionDeContactoCommand,
  ): Promise<IResultadoInformacionDeContacto> {
    const informacion = await this.estado.leerInformacionDeContacto();
    if (!informacion) {
      throw new InformacionDeContactoRechazadaException(
        'La información de contacto de la empresa aún no ha sido inicializada.',
      );
    }
    return this.resolver(command.entrada).ejecutar(informacion, command.entrada);
  }

  private resolver(
    entrada: IEntradaModificacionDeContacto,
  ): IModificarInformacionDeContactoStrategy {
    const compatibles = this.estrategias.filter((estrategia) => estrategia.soporta(entrada));
    if (compatibles.length === 0) {
      throw new InformacionDeContactoRechazadaException(
        `No hay una estrategia que soporte la modificación de tipo '${entrada.tipo}'.`,
      );
    }
    if (compatibles.length > 1) {
      throw new Error(
        `Configuración inválida: ${compatibles.length} estrategias soportan el tipo '${entrada.tipo}'.`,
      );
    }
    return compatibles[0]!;
  }
}
