namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public sealed record ProjectMediaId
{
    public ProjectMediaId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ProjectMediaId cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }

    public static ProjectMediaId New() => new(Guid.NewGuid());
}
