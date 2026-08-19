namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public sealed record ProjectServiceReference
{
    public ProjectServiceReference(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("The referenced service identifier cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }
}
