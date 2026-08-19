namespace CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

public sealed record Address
{
    public Address(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Address cannot be empty.", nameof(value));
        }

        Value = value.Trim();
    }

    public string Value { get; }

    public override string ToString() => Value;
}
