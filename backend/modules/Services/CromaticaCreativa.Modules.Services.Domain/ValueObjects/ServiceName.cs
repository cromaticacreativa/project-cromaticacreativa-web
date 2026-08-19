namespace CromaticaCreativa.Modules.Services.Domain.ValueObjects;

public sealed record ServiceName
{
    public ServiceName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Service name cannot be empty.", nameof(value));
        }

        Value = value.Trim();
    }

    public string Value { get; }

    public override string ToString() => Value;
}
