namespace CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

public sealed record CompanyContactInformationId
{
    public CompanyContactInformationId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("CompanyContactInformationId cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }

    public static CompanyContactInformationId New() => new(Guid.NewGuid());
}
