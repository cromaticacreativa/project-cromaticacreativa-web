import { BusinessRejectionError, mapDatabaseError, TechnicalError } from './errors';
import { NestInternalClient } from './nestClient';
import { CompanyProfileRepository } from './repository';
import type { CompanyProfileView } from './types';

const COLLECTION = { phone: 'phone', email: 'email', socialLink: 'social_link', location: 'location' } as const;

/** UUID (cualquier versión) — acota la entrada antes de tocar la BD. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Orquesta la Información General del CMS.
 *
 *  - GET  : Strapi → MySQL (directo, sin NestJS).
 *  - DELETE: Strapi → MySQL (directo, sin NestJS).
 *  - CREATE/UPDATE: Strapi → NestJS (valida/canonicaliza) → Strapi escribe el
 *    payload canónico → MySQL. Fail closed: si NestJS rechaza o falla, NO escribe.
 *    Nunca se usa el payload original para escribir tras la validación.
 */
export class CompanyProfileCmsService {
  public constructor(
    private readonly repo: CompanyProfileRepository,
    private readonly nest: NestInternalClient,
  ) {}

  // ---------- GET (directo) ----------
  public getInformacionGeneral(): Promise<CompanyProfileView> {
    return this.repo.getView();
  }

  // ---------- DELETE (directo) ----------
  public async deletePhone(id: string): Promise<void> {
    this.assertUuid(id);
    await this.deleteOrThrow(() => this.repo.deletePhone(id));
  }
  public async deleteEmail(id: string): Promise<void> {
    this.assertUuid(id);
    await this.deleteOrThrow(() => this.repo.deleteEmail(id));
  }
  public async deleteSocialLink(id: string): Promise<void> {
    this.assertUuid(id);
    await this.deleteOrThrow(() => this.repo.deleteSocialLink(id));
  }
  public async deleteLocation(): Promise<void> {
    const profile = await this.repo.getSingleton();
    if (!profile) throw new BusinessRejectionError('No existe el registro.', 404);
    await this.deleteOrThrow(() => this.repo.deleteLocation(profile.id));
  }

  // ---------- Singleton / recipient (CREATE/UPDATE vía NestJS) ----------
  /** Inicializa el singleton cuando no existe (NestJS valida → Strapi inserta). */
  public async initialize(recipientEmail: unknown): Promise<CompanyProfileView> {
    const payload = await this.nest.post<{
      id: string;
      singleton_key: number;
      contact_request_recipient_email: string;
    }>('initialize', { payload: { contact_request_recipient_email: recipientEmail } });
    await this.write(() => this.repo.createSingleton(payload));
    return this.getInformacionGeneral();
  }

  public async setRecipientEmail(recipientEmail: unknown): Promise<CompanyProfileView> {
    const payload = await this.nest.post<{ contact_request_recipient_email: string }>(
      'contact-request-recipient-email',
      { payload: { contact_request_recipient_email: recipientEmail } },
    );
    await this.applyUpdate(
      async () => (await this.repo.getSingleton()) !== null,
      () => this.repo.updateRecipientEmail(payload.contact_request_recipient_email),
    );
    return this.getInformacionGeneral();
  }

  // ---------- Phone ----------
  public async addPhone(number: unknown): Promise<CompanyProfileView> {
    const payload = await this.nest.post<{ company_profile_id: string; number: string; display_order: number }>(
      'contact-information',
      { collection: COLLECTION.phone, payload: { number } },
    );
    await this.write(() => this.repo.insertPhone(payload));
    return this.getInformacionGeneral();
  }
  public async updatePhone(id: string, number: unknown): Promise<CompanyProfileView> {
    this.assertUuid(id);
    const payload = await this.nest.post<{ number: string }>('contact-information/modify', {
      collection: COLLECTION.phone,
      id,
      payload: { number },
    });
    await this.applyUpdate(() => this.repo.phoneExists(id), () => this.repo.updatePhone(id, payload));
    return this.getInformacionGeneral();
  }

  // ---------- Email ----------
  public async addEmail(address: unknown): Promise<CompanyProfileView> {
    const payload = await this.nest.post<{ company_profile_id: string; address: string; display_order: number }>(
      'contact-information',
      { collection: COLLECTION.email, payload: { address } },
    );
    await this.write(() => this.repo.insertEmail(payload));
    return this.getInformacionGeneral();
  }
  public async updateEmail(id: string, address: unknown): Promise<CompanyProfileView> {
    this.assertUuid(id);
    const payload = await this.nest.post<{ address: string }>('contact-information/modify', {
      collection: COLLECTION.email,
      id,
      payload: { address },
    });
    await this.applyUpdate(() => this.repo.emailExists(id), () => this.repo.updateEmail(id, payload));
    return this.getInformacionGeneral();
  }

  // ---------- SocialLink ----------
  public async addSocialLink(network: unknown, url: unknown): Promise<CompanyProfileView> {
    const payload = await this.nest.post<{
      company_profile_id: string;
      network: string;
      url: string;
      display_order: number;
    }>('contact-information', { collection: COLLECTION.socialLink, payload: { network, url } });
    await this.write(() => this.repo.insertSocialLink(payload));
    return this.getInformacionGeneral();
  }
  public async updateSocialLink(id: string, network: unknown, url: unknown): Promise<CompanyProfileView> {
    this.assertUuid(id);
    const payload = await this.nest.post<{ network: string; url: string }>('contact-information/modify', {
      collection: COLLECTION.socialLink,
      id,
      payload: { network, url },
    });
    await this.applyUpdate(() => this.repo.socialLinkExists(id), () => this.repo.updateSocialLink(id, payload));
    return this.getInformacionGeneral();
  }

  // ---------- Location ----------
  public async addLocation(address: unknown, latitude: unknown, longitude: unknown): Promise<CompanyProfileView> {
    const payload = await this.nest.post<{
      company_profile_id: string;
      address: string;
      latitude: number;
      longitude: number;
    }>('location', { collection: COLLECTION.location, payload: { address, latitude, longitude } });
    await this.write(() =>
      this.repo.insertLocation({
        company_profile_id: payload.company_profile_id,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
      }),
    );
    return this.getInformacionGeneral();
  }
  public async updateLocation(address: unknown, latitude: unknown, longitude: unknown): Promise<CompanyProfileView> {
    const profile = await this.repo.getSingleton();
    if (!profile) throw new BusinessRejectionError('La información de contacto aún no fue inicializada.', 409);
    const payload = await this.nest.post<{ address: string; latitude: number; longitude: number }>(
      'location/modify',
      { collection: COLLECTION.location, payload: { address, latitude, longitude } },
    );
    await this.applyUpdate(
      async () => (await this.repo.getLocation()) !== null,
      () => this.repo.updateLocation(profile.id, payload),
    );
    return this.getInformacionGeneral();
  }

  /** Ejecuta la escritura final y traduce errores de constraint MySQL a seguros. */
  private async write(fn: () => Promise<unknown>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      if (error instanceof BusinessRejectionError || error instanceof TechnicalError) throw error;
      throw mapDatabaseError(error);
    }
  }

  private async deleteOrThrow(fn: () => Promise<number>): Promise<void> {
    let affected: number;
    try {
      affected = await fn();
    } catch (error) {
      throw mapDatabaseError(error);
    }
    if (affected === 0) throw new BusinessRejectionError('El registro ya no existe.', 404);
  }

  /**
   * Escribe un UPDATE final y distingue el registro inexistente de un update
   * idempotente: MySQL/Knex (mysql2, sin `foundRows`) reporta 0 filas afectadas
   * cuando el valor no cambió. Por eso, si `affected === 0`, se re-verifica la
   * existencia: si sigue existiendo → éxito idempotente; si no → 404 (fue eliminado
   * en la ventana validar→escribir).
   */
  private async applyUpdate(exists: () => Promise<boolean>, update: () => Promise<number>): Promise<void> {
    await this.write(async () => {
      const affected = await update();
      if (affected === 0 && !(await exists())) {
        throw new BusinessRejectionError('El registro ya no existe.', 404);
      }
    });
  }

  /** Valida que `id` sea un UUID; evita queries con entrada arbitraria. */
  private assertUuid(id: unknown): asserts id is string {
    if (typeof id !== 'string' || !UUID_RE.test(id)) {
      throw new BusinessRejectionError('Identificador inválido.', 400);
    }
  }
}
