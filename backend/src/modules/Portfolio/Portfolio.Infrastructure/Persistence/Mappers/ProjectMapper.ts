import { ProjectPersistenceDto } from '../../../Portfolio.Commons/DTOs/ProjectPersistenceDto';
import { Project } from '../../../Portfolio.Domain/Aggregates/Project';
import { MediaType } from '../../../Portfolio.Domain/Enums/MediaType';
import { PublicationStatus } from '../../../Portfolio.Domain/Enums/PublicationStatus';
import { CalendarDate } from '../../../Portfolio.Domain/ValueObjects/CalendarDate';
import { CorporateClientId } from '../../../Portfolio.Domain/ValueObjects/CorporateClientId';
import { DisplayOrder } from '../../../Portfolio.Domain/ValueObjects/DisplayOrder';
import { MediaReference } from '../../../Portfolio.Domain/ValueObjects/MediaReference';
import { ProjectCategoryReference } from '../../../Portfolio.Domain/ValueObjects/ProjectCategoryReference';
import { ProjectId } from '../../../Portfolio.Domain/ValueObjects/ProjectId';
import { ProjectMediaId } from '../../../Portfolio.Domain/ValueObjects/ProjectMediaId';
import { ProjectPeriod } from '../../../Portfolio.Domain/ValueObjects/ProjectPeriod';
import { ProjectServiceReference } from '../../../Portfolio.Domain/ValueObjects/ProjectServiceReference';
import { ProjectTitle } from '../../../Portfolio.Domain/ValueObjects/ProjectTitle';
import { MediaPersistenceModel } from '../Models/MediaPersistenceModel';
import { ProjectPersistenceModel } from '../Models/ProjectPersistenceModel';

export class ProjectMapper {
  public static toDomain(model: ProjectPersistenceDto): Project {
    const project = Project.create({
      id: new ProjectId(model.id),
      description: model.description,
      service: new ProjectServiceReference(model.serviceId),
      category: new ProjectCategoryReference(model.categoryId),
      period: new ProjectPeriod(new CalendarDate(model.startDate), new CalendarDate(model.endDate)),
      order: new DisplayOrder(model.displayOrder),
      title: model.title ? new ProjectTitle(model.title) : null,
      corporateClientId: model.corporateClientId ? new CorporateClientId(model.corporateClientId) : null,
    });

    let coverId: ProjectMediaId | null = null;
    for (const item of [...(model.media ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id))) {
      project.addMedia(new ProjectMediaId(item.id), new MediaReference(item.reference), this.toMediaType(item.type),
        new DisplayOrder(item.displayOrder));
      if (item.isCover) {
        if (coverId) throw new Error(`El proyecto '${model.id}' contiene más de un medio marcado como portada.`);
        coverId = new ProjectMediaId(item.id);
      }
    }
    if (coverId) project.setCoverMedia(coverId);

    if (model.publicationStatus === PublicationStatus.Published) project.publish();
    else if (model.publicationStatus !== PublicationStatus.Draft) {
      throw new Error(`El proyecto '${model.id}' tiene el estado no soportado '${model.publicationStatus}'.`);
    }
    return project;
  }

  public static toPersistence(project: Project): ProjectPersistenceModel {
    const model = Object.assign(new ProjectPersistenceModel(), {
      id: project.id.value,
      title: project.title?.value ?? null,
      description: project.description,
      publicationStatus: project.status,
      displayOrder: project.order.value,
      corporateClientId: project.corporateClientId?.value ?? null,
      serviceId: project.service.value,
      categoryId: project.category.value,
      startDate: project.period.startDate.value,
      endDate: project.period.endDate.value,
      corporateClient: null,
    });
    model.media = project.media.map((item) => Object.assign(new MediaPersistenceModel(), {
      id: item.id.value,
      projectId: project.id.value,
      reference: item.reference.value,
      type: item.type,
      displayOrder: item.order.value,
      isCover: project.coverMediaId?.equals(item.id) ?? false,
      coverProjectId: null,
      project: model,
    }));
    return model;
  }

  private static toMediaType(value: string): MediaType {
    if (value === MediaType.Image || value === MediaType.Video) return value;
    throw new Error(`El tipo de medio persistido '${value}' no es soportado.`);
  }
}
