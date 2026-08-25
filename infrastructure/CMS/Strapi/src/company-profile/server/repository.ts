import { randomUUID } from 'node:crypto';
import { KnexLike, TABLES } from './database';
import type {
  CompanyProfileRow,
  CompanyProfileView,
  EmailRow,
  LocationRow,
  PhoneRow,
  SocialLinkRow,
} from './types';

/**
 * Acceso server-side a las tablas de negocio de CompanyProfile, encapsulado.
 * Usa la conexión Knex interna de Strapi con queries parametrizadas (nunca
 * concatena input del usuario en SQL). NO modela estas tablas como content-types.
 *
 * IDs técnicos: sigue el criterio de Infrastructure — `randomUUID()` (CHAR(36))
 * para filas nuevas de `phone`/`email`/`social_link`. `location` usa
 * `company_profile_id` como PK/FK (sin id propio). El schema lo gobiernan las
 * TypeORM migrations; este repositorio no lo altera.
 */
export class CompanyProfileRepository {
  public constructor(private readonly knex: KnexLike) {}

  // ---- company_profile (singleton) ----
  public async getSingleton(): Promise<CompanyProfileRow | null> {
    const row = (await this.knex(TABLES.companyProfile).where({ singleton_key: 1 }).first()) as
      | CompanyProfileRow
      | undefined;
    return row ?? null;
  }

  /** Crea el singleton con el payload canónico devuelto por NestJS (initialize). */
  public async createSingleton(payload: {
    id: string;
    singleton_key: number;
    contact_request_recipient_email: string;
  }): Promise<void> {
    await this.knex(TABLES.companyProfile).insert({
      id: payload.id,
      singleton_key: payload.singleton_key,
      contact_request_recipient_email: payload.contact_request_recipient_email,
    });
  }

  public async updateRecipientEmail(email: string): Promise<number> {
    return this.knex(TABLES.companyProfile)
      .where({ singleton_key: 1 })
      .update({ contact_request_recipient_email: email });
  }

  // ---- children helpers ----
  private async list<T>(table: string): Promise<T[]> {
    return (await this.knex(table).orderBy('display_order', 'asc').select('*')) as T[];
  }

  private async deleteChildById(table: string, id: string): Promise<number> {
    return this.knex(table).where({ id }).del();
  }

  private async existsById(table: string, id: string): Promise<boolean> {
    return (await this.knex(table).where({ id }).first()) !== undefined;
  }

  public phoneExists(id: string): Promise<boolean> {
    return this.existsById(TABLES.phone, id);
  }
  public emailExists(id: string): Promise<boolean> {
    return this.existsById(TABLES.email, id);
  }
  public socialLinkExists(id: string): Promise<boolean> {
    return this.existsById(TABLES.socialLink, id);
  }

  // ---- phone ----
  public listPhones(): Promise<PhoneRow[]> {
    return this.list<PhoneRow>(TABLES.phone);
  }

  /** Inserta desde el payload canónico aprobado por NestJS; genera el id técnico. */
  public async insertPhone(payload: {
    company_profile_id: string;
    number: string;
    display_order: number;
  }): Promise<PhoneRow> {
    const row: PhoneRow = { id: randomUUID(), ...payload };
    await this.knex(TABLES.phone).insert(row);
    return row;
  }

  public async updatePhone(id: string, payload: { number: string }): Promise<number> {
    return this.knex(TABLES.phone).where({ id }).update({ number: payload.number });
  }

  public deletePhone(id: string): Promise<number> {
    return this.deleteChildById(TABLES.phone, id);
  }

  // ---- email ----
  public listEmails(): Promise<EmailRow[]> {
    return this.list<EmailRow>(TABLES.email);
  }

  public async insertEmail(payload: {
    company_profile_id: string;
    address: string;
    display_order: number;
  }): Promise<EmailRow> {
    const row: EmailRow = { id: randomUUID(), ...payload };
    await this.knex(TABLES.email).insert(row);
    return row;
  }

  public async updateEmail(id: string, payload: { address: string }): Promise<number> {
    return this.knex(TABLES.email).where({ id }).update({ address: payload.address });
  }

  public deleteEmail(id: string): Promise<number> {
    return this.deleteChildById(TABLES.email, id);
  }

  // ---- social_link ----
  public listSocialLinks(): Promise<SocialLinkRow[]> {
    return this.list<SocialLinkRow>(TABLES.socialLink);
  }

  public async insertSocialLink(payload: {
    company_profile_id: string;
    network: string;
    url: string;
    display_order: number;
  }): Promise<SocialLinkRow> {
    const row: SocialLinkRow = { id: randomUUID(), ...payload };
    await this.knex(TABLES.socialLink).insert(row);
    return row;
  }

  public async updateSocialLink(
    id: string,
    payload: { network: string; url: string },
  ): Promise<number> {
    return this.knex(TABLES.socialLink)
      .where({ id })
      .update({ network: payload.network, url: payload.url });
  }

  public deleteSocialLink(id: string): Promise<number> {
    return this.deleteChildById(TABLES.socialLink, id);
  }

  // ---- location (0..1; company_profile_id es PK/FK) ----
  public async getLocation(): Promise<LocationRow | null> {
    const row = (await this.knex(TABLES.location).first()) as LocationRow | undefined;
    return row ?? null;
  }

  public async insertLocation(payload: LocationRow): Promise<void> {
    await this.knex(TABLES.location).insert(payload);
  }

  public async updateLocation(
    companyProfileId: string,
    payload: { address: string; latitude: number; longitude: number },
  ): Promise<number> {
    return this.knex(TABLES.location)
      .where({ company_profile_id: companyProfileId })
      .update({ address: payload.address, latitude: payload.latitude, longitude: payload.longitude });
  }

  public async deleteLocation(companyProfileId: string): Promise<number> {
    return this.knex(TABLES.location).where({ company_profile_id: companyProfileId }).del();
  }

  /** Proyección completa ordenada para el GET directo. */
  public async getView(): Promise<CompanyProfileView> {
    const [profile, phones, emails, socialLinks, location] = await Promise.all([
      this.getSingleton(),
      this.listPhones(),
      this.listEmails(),
      this.listSocialLinks(),
      this.getLocation(),
    ]);
    return {
      companyProfileId: profile?.id ?? null,
      recipientEmail: profile?.contact_request_recipient_email ?? null,
      phones: phones.map((p) => ({ id: p.id, number: p.number, displayOrder: p.display_order })),
      emails: emails.map((e) => ({ id: e.id, address: e.address, displayOrder: e.display_order })),
      socialLinks: socialLinks.map((s) => ({
        id: s.id,
        network: s.network,
        url: s.url,
        displayOrder: s.display_order,
      })),
      location: location
        ? { address: location.address, latitude: location.latitude, longitude: location.longitude }
        : null,
    };
  }
}
