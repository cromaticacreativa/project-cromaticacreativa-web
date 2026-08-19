namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public sealed record CorporateClientId
{
    public CorporateClientId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("CorporateClientId cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }

    public static CorporateClientId New() => new(Guid.NewGuid());
}
