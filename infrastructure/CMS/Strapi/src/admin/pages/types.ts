export interface PhoneItem {
  id: string;
  number: string;
  displayOrder: number;
}
export interface EmailItem {
  id: string;
  address: string;
  displayOrder: number;
}
export interface SocialLinkItem {
  id: string;
  network: string;
  url: string;
  displayOrder: number;
}
export interface LocationItem {
  address: string;
  latitude: number;
  longitude: number;
}

/** Vista devuelta por GET /company-profile/informacion-general. */
export interface CompanyProfileView {
  companyProfileId: string | null;
  recipientEmail: string | null;
  phones: PhoneItem[];
  emails: EmailItem[];
  socialLinks: SocialLinkItem[];
  location: LocationItem | null;
}

export interface FieldError {
  field: string;
  message: string;
}
