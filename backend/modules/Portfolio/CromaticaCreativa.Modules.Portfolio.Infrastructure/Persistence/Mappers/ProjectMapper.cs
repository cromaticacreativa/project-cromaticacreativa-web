using CromaticaCreativa.Modules.Portfolio.Domain.Aggregates;
using CromaticaCreativa.Modules.Portfolio.Domain.Enums;
using CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;
using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;

namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Mappers;

public static class ProjectMapper
{
    public static Project ToDomain(ProjectModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var project = Project.Create(
            new ProjectId(model.Id),
            model.Description,
            new ProjectServiceReference(model.ServiceId),
            new ProjectCategoryReference(model.CategoryId),
            new ProjectPeriod(model.StartDate, model.EndDate),
            new DisplayOrder(model.DisplayOrder),
            model.Title is null ? null : new ProjectTitle(model.Title),
            model.CorporateClientId is null ? null : new CorporateClientId(model.CorporateClientId.Value));

        MediaModel? cover = null;
        foreach (var mediaModel in model.Media.OrderBy(item => item.DisplayOrder).ThenBy(item => item.Id))
        {
            project.AddMedia(
                new ProjectMediaId(mediaModel.Id),
                new MediaReference(mediaModel.Reference),
                ToDomainMediaType(mediaModel.Type),
                new DisplayOrder(mediaModel.DisplayOrder));

            if (mediaModel.IsCover)
            {
                if (cover is not null)
                {
                    throw new InvalidOperationException($"Project '{model.Id}' has more than one cover media row.");
                }

                cover = mediaModel;
            }
        }

        if (cover is not null)
        {
            project.SetCoverMedia(new ProjectMediaId(cover.Id));
        }

        switch (model.PublicationStatus)
        {
            case PortfolioPersistenceValues.Draft:
                break;
            case PortfolioPersistenceValues.Published:
                project.Publish();
                break;
            default:
                throw new InvalidOperationException(
                    $"Project '{model.Id}' has unsupported publication status '{model.PublicationStatus}'.");
        }

        return project;
    }

    public static ProjectModel ToPersistence(Project project)
    {
        ArgumentNullException.ThrowIfNull(project);

        return new ProjectModel
        {
            Id = project.Id.Value,
            Title = project.Title?.Value,
            Description = project.Description,
            PublicationStatus = project.Status switch
            {
                PublicationStatus.Draft => PortfolioPersistenceValues.Draft,
                PublicationStatus.Published => PortfolioPersistenceValues.Published,
                _ => throw new InvalidOperationException($"Unsupported Domain publication status '{project.Status}'.")
            },
            DisplayOrder = project.Order.Value,
            CorporateClientId = project.CorporateClientId?.Value,
            ServiceId = project.Service.Value,
            CategoryId = project.Category.Value,
            StartDate = project.Period.StartDate,
            EndDate = project.Period.EndDate,
            Media = project.Media.Select(media => new MediaModel
            {
                Id = media.Id.Value,
                ProjectId = project.Id.Value,
                Reference = media.Reference.Value,
                Type = media.Type switch
                {
                    MediaType.Image => PortfolioPersistenceValues.Image,
                    MediaType.Video => PortfolioPersistenceValues.Video,
                    _ => throw new InvalidOperationException($"Unsupported Domain media type '{media.Type}'.")
                },
                DisplayOrder = media.Order.Value,
                IsCover = project.CoverMediaId == media.Id
            }).ToList()
        };
    }

    private static MediaType ToDomainMediaType(string value) => value switch
    {
        PortfolioPersistenceValues.Image => MediaType.Image,
        PortfolioPersistenceValues.Video => MediaType.Video,
        _ => throw new InvalidOperationException($"Unsupported persistence media type '{value}'.")
    };
}
