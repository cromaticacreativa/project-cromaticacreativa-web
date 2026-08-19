namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public sealed record ProjectCategoryReference
{
    public ProjectCategoryReference(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("The referenced category identifier cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }
}
