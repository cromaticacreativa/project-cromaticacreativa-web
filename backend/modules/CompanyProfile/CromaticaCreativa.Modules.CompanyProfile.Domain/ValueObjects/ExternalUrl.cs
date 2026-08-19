namespace CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

public sealed record ExternalUrl
{
    public ExternalUrl(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("External URL cannot be empty.", nameof(value));
        }

        var normalized = value.Trim();
        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("External URL must be an absolute HTTP or HTTPS URL.", nameof(value));
        }

        Value = normalized;
    }

    public string Value { get; }

    public override string ToString() => Value;
}
