import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InformacionDeContactoRechazadaException } from '../../Exceptions/InformacionDeContactoRechazadaException';
import {
  AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES,
  IAgregarInformacionDeContactoStrategy,
} from '../../Ports/IAgregarInformacionDeContactoStrategy';
import { IEntradaInformacionDeContacto } from '../../Ports/IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContacto } from '../../Ports/IResultadoInformacionDeContacto';
import {
  COMPANY_PROFILE_STATE_READER,
  ICompanyProfileStateReader,
} from '../../Ports/ICompanyProfileStateReader';
import { AgregarInformacionDeContactoCommand } from './AgregarInformacionDeContactoCommand';

@CommandHandler(AgregarInformacionDeContactoCommand)
export class AgregarInformacionDeContactoCommandHandler
implements ICommandHandler<AgregarInformacionDeContactoCommand, IResultadoInformacionDeContacto> {
  public constructor(
    @Inject(COMPANY_PROFILE_STATE_READER) private readonly estado: ICompanyProfileStateReader,
    @Inject(AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES)
    private readonly estrategias: readonly IAgregarInformacionDeContactoStrategy[],
  ) {}

  public async execute(command: AgregarInformacionDeContactoCommand): Promise<IResultadoInformacionDeContacto> {
    const informacion = await this.estado.leerInformacionDeContacto();
    if (!informacion) {
      throw new InformacionDeContactoRechazadaException(
        'La información de contacto de la empresa aún no ha sido inicializada.',
      );
    }

    const estrategia = this.resolver(command.entrada);
    return estrategia.ejecutar(informacion, command.entrada);
  }

  private resolver(entrada: IEntradaInformacionDeContacto): IAgregarInformacionDeContactoStrategy {
    const compatibles = this.estrategias.filter((estrategia) => estrategia.soporta(entrada));
    if (compatibles.length === 0) {
      throw new InformacionDeContactoRechazadaException(
        `No hay una estrategia que soporte la información de contacto de tipo '${entrada.tipo}'.`,
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
