namespace CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

public sealed record SocialLink
{
    public SocialLink(string network, ExternalUrl url)
    {
        if (string.IsNullOrWhiteSpace(network))
        {
            throw new ArgumentException("Social network cannot be empty.", nameof(network));
        }

        Network = network.Trim();
        Url = url ?? throw new ArgumentNullException(nameof(url));
    }

    public string Network { get; }

    public ExternalUrl Url { get; }
}
