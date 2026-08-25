/** Contratos de datos del CMS para CompanyProfile (consistentes con NestJS). */

export interface PhoneRow {
  id: string;
  company_profile_id: string;
  number: string;
  display_order: number;
}

export interface EmailRow {
  id: string;
  company_profile_id: string;
  address: string;
  display_order: number;
}

export interface SocialLinkRow {
  id: string;
  company_profile_id: string;
  network: string;
  url: string;
  display_order: number;
}

export interface LocationRow {
  company_profile_id: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CompanyProfileRow {
  id: string;
  singleton_key: number;
  contact_request_recipient_email: string;
}

/** Proyección devuelta por el GET directo (Strapi → MySQL). */
export interface CompanyProfileView {
  companyProfileId: string | null;
  recipientEmail: string | null;
  phones: Array<{ id: string; number: string; displayOrder: number }>;
  emails: Array<{ id: string; address: string; displayOrder: number }>;
  socialLinks: Array<{ id: string; network: string; url: string; displayOrder: number }>;
  location: { address: string; latitude: number; longitude: number } | null;
}
