namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public sealed record CorporateClientName
{
    public CorporateClientName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Corporate client name cannot be empty.", nameof(value));
        }

        Value = value.Trim();
    }

    public string Value { get; }

    public override string ToString() => Value;
}
