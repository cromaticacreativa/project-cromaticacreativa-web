namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public sealed record ProjectId
{
    public ProjectId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ProjectId cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }

    public static ProjectId New() => new(Guid.NewGuid());
}
