import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';

export interface ICompanyProfileStateReader {
  leerInformacionDeContacto(): Promise<CompanyContactInformation | null>;
}

export const COMPANY_PROFILE_STATE_READER = Symbol('ICompanyProfileStateReader');
