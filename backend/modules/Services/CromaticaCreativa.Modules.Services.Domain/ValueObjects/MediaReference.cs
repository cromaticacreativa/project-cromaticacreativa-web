namespace CromaticaCreativa.Modules.Services.Domain.ValueObjects;

public sealed record MediaReference
{
    public MediaReference(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Media reference cannot be empty.", nameof(value));
        }

        Value = value.Trim();
    }

    public string Value { get; }

    public override string ToString() => Value;
}
