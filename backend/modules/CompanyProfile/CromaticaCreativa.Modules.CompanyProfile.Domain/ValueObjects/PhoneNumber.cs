namespace CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

public sealed record PhoneNumber
{
    public PhoneNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Phone number cannot be empty.", nameof(value));
        }

        Value = value.Trim();
    }

    public string Value { get; }

    public override string ToString() => Value;
}
