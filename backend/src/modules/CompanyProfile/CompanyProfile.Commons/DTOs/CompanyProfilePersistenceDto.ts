import { EmailPersistenceDto } from './EmailPersistenceDto';
import { LocationPersistenceDto } from './LocationPersistenceDto';
import { PhonePersistenceDto } from './PhonePersistenceDto';
import { SocialLinkPersistenceDto } from './SocialLinkPersistenceDto';

export type CompanyProfilePersistenceDto = {
  id: string;
  singletonKey: number;
  contactRequestRecipientEmail: string;
  phones: readonly PhonePersistenceDto[];
  emails: readonly EmailPersistenceDto[];
  location: LocationPersistenceDto | null;
  socialLinks: readonly SocialLinkPersistenceDto[];
};
