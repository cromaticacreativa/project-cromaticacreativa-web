import { ICreateProjectParameters } from '../Abstract/ICreateProjectParameters';
import { ProjectMedia } from '../Entities/ProjectMedia';
import { MediaType } from '../Enums/MediaType';
import { PublicationStatus } from '../Enums/PublicationStatus';
import { ProjectCannotBePublishedException } from '../Exceptions/ProjectCannotBePublishedException';
import { ProjectMediaAlreadyAttachedException } from '../Exceptions/ProjectMediaAlreadyAttachedException';
import { ProjectMediaNotFoundException } from '../Exceptions/ProjectMediaNotFoundException';
import { CorporateClientId } from '../ValueObjects/CorporateClientId';
import { DisplayOrder } from '../ValueObjects/DisplayOrder';
import { MediaReference } from '../ValueObjects/MediaReference';
import { ProjectCategoryReference } from '../ValueObjects/ProjectCategoryReference';
import { ProjectId } from '../ValueObjects/ProjectId';
import { ProjectMediaId } from '../ValueObjects/ProjectMediaId';
import { ProjectPeriod } from '../ValueObjects/ProjectPeriod';
import { ProjectServiceReference } from '../ValueObjects/ProjectServiceReference';
import { ProjectTitle } from '../ValueObjects/ProjectTitle';

export class Project {
  private readonly mediaItems: ProjectMedia[] = [];
  private _status = PublicationStatus.Draft;
  private _coverMediaId: ProjectMediaId | null = null;

  private constructor(
    public readonly id: ProjectId,
    private _description: string,
    private _service: ProjectServiceReference,
    private _category: ProjectCategoryReference,
    private _period: ProjectPeriod,
    private _order: DisplayOrder,
    private _title: ProjectTitle | null,
    private _corporateClientId: CorporateClientId | null,
  ) {}

  public static create(input: ICreateProjectParameters): Project {
    return new Project(input.id, input.description ?? '', input.service, input.category, input.period,
      input.order, input.title ?? null, input.corporateClientId ?? null);
  }

  public get title(): ProjectTitle | null { return this._title; }
  public get description(): string { return this._description; }
  public get status(): PublicationStatus { return this._status; }
  public get order(): DisplayOrder { return this._order; }
  public get corporateClientId(): CorporateClientId | null { return this._corporateClientId; }
  public get service(): ProjectServiceReference { return this._service; }
  public get category(): ProjectCategoryReference { return this._category; }
  public get period(): ProjectPeriod { return this._period; }
  public get coverMediaId(): ProjectMediaId | null { return this._coverMediaId; }
  public get media(): readonly ProjectMedia[] { return [...this.mediaItems]; }

  public rename(title: ProjectTitle): void { this._title = title; }
  public changeDescription(description?: string | null): void { this._description = description ?? ''; }
  public publish(): void {
    if (!this._title) throw new ProjectCannotBePublishedException();
    this._status = PublicationStatus.Published;
  }
  public unpublish(): void { this._status = PublicationStatus.Draft; }
  public assignCorporateClient(id: CorporateClientId): void { this._corporateClientId = id; }
  public removeCorporateClient(): void { this._corporateClientId = null; }
  public changeClassification(service: ProjectServiceReference, category: ProjectCategoryReference): void {
    this._service = service;
    this._category = category;
  }
  public changePeriod(period: ProjectPeriod): void { this._period = period; }
  public changeOrder(order: DisplayOrder): void { this._order = order; }

  public addMedia(id: ProjectMediaId, reference: MediaReference, type: MediaType, order: DisplayOrder): ProjectMedia {
    if (this.mediaItems.some((item) => item.id.equals(id))) {
      throw new ProjectMediaAlreadyAttachedException(id.value);
    }
    const media = new ProjectMedia(id, reference, type, order);
    this.mediaItems.push(media);
    return media;
  }

  public updateMedia(id: ProjectMediaId, reference: MediaReference, type: MediaType, order: DisplayOrder): void {
    const index = this.findMediaIndex(id);
    this.mediaItems[index] = this.mediaItems[index]!.withChanges(reference, type, order);
  }

  public changeMediaOrder(id: ProjectMediaId, order: DisplayOrder): void {
    const index = this.findMediaIndex(id);
    this.mediaItems[index] = this.mediaItems[index]!.withOrder(order);
  }

  public setCoverMedia(id: ProjectMediaId): void { this.findMediaIndex(id); this._coverMediaId = id; }
  public clearCoverMedia(): void { this._coverMediaId = null; }
  public removeMedia(id: ProjectMediaId): void {
    this.mediaItems.splice(this.findMediaIndex(id), 1);
    if (this._coverMediaId?.equals(id)) this._coverMediaId = null;
  }

  private findMediaIndex(id: ProjectMediaId): number {
    const index = this.mediaItems.findIndex((item) => item.id.equals(id));
    if (index < 0) throw new ProjectMediaNotFoundException(id.value);
    return index;
  }
}
