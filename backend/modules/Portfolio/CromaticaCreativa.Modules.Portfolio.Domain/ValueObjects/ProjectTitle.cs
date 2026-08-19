namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public sealed record ProjectTitle
{
    public ProjectTitle(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Project title cannot be empty.", nameof(value));
        }

        Value = value.Trim();
    }

    public string Value { get; }

    public override string ToString() => Value;
}
