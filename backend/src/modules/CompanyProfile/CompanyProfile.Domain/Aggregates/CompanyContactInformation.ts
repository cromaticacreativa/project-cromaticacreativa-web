import { CompanyContactInformationId } from '../ValueObjects/CompanyContactInformationId';
import { CompanyLocation } from '../ValueObjects/CompanyLocation';
import { EmailAddress } from '../ValueObjects/EmailAddress';
import { PhoneNumber } from '../ValueObjects/PhoneNumber';
import { SocialLink } from '../ValueObjects/SocialLink';

export class CompanyContactInformation {
  private readonly phoneItems: PhoneNumber[] = [];
  private readonly emailItems: EmailAddress[] = [];
  private readonly socialLinkItems: SocialLink[] = [];
  private _location: CompanyLocation | null = null;

  private constructor(public readonly id: CompanyContactInformationId,
    private _contactRequestRecipientEmail: EmailAddress) {}

  public static create(id: CompanyContactInformationId, recipient: EmailAddress): CompanyContactInformation {
    return new CompanyContactInformation(id, recipient);
  }
  
  public get phones(): readonly PhoneNumber[] { return [...this.phoneItems]; }
  public get emails(): readonly EmailAddress[] { return [...this.emailItems]; }
  public get contactRequestRecipientEmail(): EmailAddress { return this._contactRequestRecipientEmail; }
  public get socialLinks(): readonly SocialLink[] { return [...this.socialLinkItems]; }
  public get location(): CompanyLocation | null { return this._location; }

  public addPhone(phone: PhoneNumber): boolean {
    if (this.phoneItems.some((item) => item.equals(phone))) return false;
    this.phoneItems.push(phone);
    return true;
  }

  public removePhone(phone: PhoneNumber): boolean {
    const index = this.phoneItems.findIndex((item) => item.equals(phone));
    if (index < 0) return false;
    this.phoneItems.splice(index, 1);
    return true;
  }

  public addEmail(email: EmailAddress): boolean {
    if (this.emailItems.some((item) => item.equals(email))) return false;
    this.emailItems.push(email);
    return true;
  }

  public removeEmail(email: EmailAddress): boolean {
    const index = this.emailItems.findIndex((item) => item.equals(email));
    if (index < 0) return false;
    this.emailItems.splice(index, 1);
    return true;
  }

  public changeContactRequestRecipientEmail(email: EmailAddress): void {
    this._contactRequestRecipientEmail = email;
  }

  public addSocialLink(link: SocialLink): boolean {
    if (this.socialLinkItems.some((item) => item.hasSameNetwork(link))) return false;
    this.socialLinkItems.push(link);
    return true;
  }

  public removeSocialLink(link: SocialLink): boolean {
    const index = this.socialLinkItems.findIndex((item) => item.hasSameNetwork(link));
    if (index < 0) return false;
    this.socialLinkItems.splice(index, 1);
    return true;
  }

  public setLocation(location: CompanyLocation): void { this._location = location; }
  public removeLocation(): void { this._location = null; }
}
