using CromaticaCreativa.Modules.Portfolio.Domain.Enums;
using CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.Portfolio.Domain.Aggregates;

public sealed class CorporateClient
{
    private CorporateClient(
        CorporateClientId id,
        CorporateClientName name,
        MediaReference logo)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Logo = logo ?? throw new ArgumentNullException(nameof(logo));
        Visibility = VisibilityStatus.Hidden;
    }

    public CorporateClientId Id { get; }

    public CorporateClientName Name { get; private set; }

    public MediaReference Logo { get; private set; }

    public VisibilityStatus Visibility { get; private set; }

    public static CorporateClient Create(
        CorporateClientId id,
        CorporateClientName name,
        MediaReference logo) =>
        new(id, name, logo);

    public void Rename(CorporateClientName name) =>
        Name = name ?? throw new ArgumentNullException(nameof(name));

    public void ChangeLogo(MediaReference logo) =>
        Logo = logo ?? throw new ArgumentNullException(nameof(logo));

    public void Show() => Visibility = VisibilityStatus.Visible;

    public void Hide() => Visibility = VisibilityStatus.Hidden;
}
