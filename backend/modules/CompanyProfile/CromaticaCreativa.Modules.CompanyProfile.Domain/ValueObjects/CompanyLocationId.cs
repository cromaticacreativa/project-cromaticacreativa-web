namespace CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

public sealed record CompanyLocationId
{
    public CompanyLocationId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("CompanyLocationId cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }

    public static CompanyLocationId New() => new(Guid.NewGuid());
}
