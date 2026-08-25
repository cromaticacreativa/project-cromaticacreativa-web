/**
 * Puerto mínimo tipo Knex que el repositorio necesita. En runtime se satisface con
 * la conexión Knex interna de Strapi (`strapi.db.connection`), pasada al construir
 * el repositorio. NO se registran las tablas de negocio como content-types de
 * Strapi (ADR-027): este adaptador accede a las tablas creadas por las TypeORM
 * migrations mediante queries parametrizadas/builder seguro, sin concatenar input.
 */
export interface QueryBuilderLike<T = Row> {
  where(condition: Partial<Row>): QueryBuilderLike<T>;
  orderBy(column: string, direction?: 'asc' | 'desc'): QueryBuilderLike<T>;
  first(): Promise<T | undefined>;
  select(...columns: string[]): Promise<T[]>;
  insert(row: object): Promise<unknown>;
  update(row: object): Promise<number>;
  del(): Promise<number>;
}

export type Row = Record<string, unknown>;

/** `knex(tableName)` → builder. `strapi.db.connection` cumple esta forma. */
export type KnexLike = (table: string) => QueryBuilderLike;

/** Tablas de negocio de CompanyProfile (fuente: CreateCompanyProfileSchema…0002). */
export const TABLES = {
  companyProfile: 'company_profile',
  phone: 'phone',
  email: 'email',
  socialLink: 'social_link',
  location: 'location',
} as const;
