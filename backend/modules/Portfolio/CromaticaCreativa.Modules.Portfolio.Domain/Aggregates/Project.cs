using CromaticaCreativa.Modules.Portfolio.Domain.Entities;
using CromaticaCreativa.Modules.Portfolio.Domain.Enums;
using CromaticaCreativa.Modules.Portfolio.Domain.Exceptions;
using CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.Portfolio.Domain.Aggregates;

public sealed class Project
{
    private readonly List<ProjectMedia> _media = [];

    private Project(
        ProjectId id,
        string? description,
        ProjectServiceReference service,
        ProjectCategoryReference category,
        ProjectPeriod period,
        DisplayOrder order,
        ProjectTitle? title,
        CorporateClientId? corporateClientId)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        Description = description ?? string.Empty;
        Service = service ?? throw new ArgumentNullException(nameof(service));
        Category = category ?? throw new ArgumentNullException(nameof(category));
        Period = period ?? throw new ArgumentNullException(nameof(period));
        Order = order;
        Title = title;
        CorporateClientId = corporateClientId;
        Status = PublicationStatus.Draft;
    }

    public ProjectId Id { get; }

    public ProjectTitle? Title { get; private set; }

    public string Description { get; private set; }

    public PublicationStatus Status { get; private set; }

    public DisplayOrder Order { get; private set; }

    public CorporateClientId? CorporateClientId { get; private set; }

    public ProjectServiceReference Service { get; private set; }

    public ProjectCategoryReference Category { get; private set; }

    public ProjectPeriod Period { get; private set; }

    public ProjectMediaId? CoverMediaId { get; private set; }

    public IReadOnlyCollection<ProjectMedia> Media => _media.AsReadOnly();

    public static Project Create(
        ProjectId id,
        string? description,
        ProjectServiceReference service,
        ProjectCategoryReference category,
        ProjectPeriod period,
        DisplayOrder order,
        ProjectTitle? title = null,
        CorporateClientId? corporateClientId = null) =>
        new(id, description, service, category, period, order, title, corporateClientId);

    public void Rename(ProjectTitle title) =>
        Title = title ?? throw new ArgumentNullException(nameof(title));

    public void ChangeDescription(string? description) => Description = description ?? string.Empty;

    public void Publish()
    {
        if (Title is null)
        {
            throw new ProjectCannotBePublishedException();
        }

        Status = PublicationStatus.Published;
    }

    public void Unpublish() => Status = PublicationStatus.Draft;

    public void AssignCorporateClient(CorporateClientId corporateClientId) =>
        CorporateClientId = corporateClientId ?? throw new ArgumentNullException(nameof(corporateClientId));

    public void RemoveCorporateClient() => CorporateClientId = null;

    public void ChangeClassification(
        ProjectServiceReference service,
        ProjectCategoryReference category)
    {
        Service = service ?? throw new ArgumentNullException(nameof(service));
        Category = category ?? throw new ArgumentNullException(nameof(category));
    }

    public void ChangePeriod(ProjectPeriod period) =>
        Period = period ?? throw new ArgumentNullException(nameof(period));

    public void ChangeOrder(DisplayOrder order) => Order = order;

    public ProjectMedia AddMedia(
        ProjectMediaId mediaId,
        MediaReference reference,
        MediaType type,
        DisplayOrder order)
    {
        ArgumentNullException.ThrowIfNull(mediaId);

        if (_media.Any(item => item.Id == mediaId))
        {
            throw new ArgumentException($"Project media '{mediaId.Value}' is already attached.", nameof(mediaId));
        }

        var media = new ProjectMedia(mediaId, reference, type, order);
        _media.Add(media);
        return media;
    }

    public void UpdateMedia(
        ProjectMediaId mediaId,
        MediaReference reference,
        MediaType type,
        DisplayOrder order)
    {
        var media = FindMedia(mediaId);
        media.ChangeReference(reference);
        media.ChangeType(type);
        media.ChangeOrder(order);
    }

    public void ChangeMediaOrder(ProjectMediaId mediaId, DisplayOrder order) =>
        FindMedia(mediaId).ChangeOrder(order);

    public void SetCoverMedia(ProjectMediaId mediaId)
    {
        FindMedia(mediaId);
        CoverMediaId = mediaId;
    }

    public void ClearCoverMedia() => CoverMediaId = null;

    public void RemoveMedia(ProjectMediaId mediaId)
    {
        var media = FindMedia(mediaId);
        _media.Remove(media);

        if (CoverMediaId == mediaId)
        {
            CoverMediaId = null;
        }
    }

    private ProjectMedia FindMedia(ProjectMediaId mediaId)
    {
        ArgumentNullException.ThrowIfNull(mediaId);
        return _media.FirstOrDefault(item => item.Id == mediaId)
            ?? throw new ProjectMediaNotFoundException(mediaId);
    }
}
