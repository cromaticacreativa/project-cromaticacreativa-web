namespace CromaticaCreativa.Modules.Services.Domain.ValueObjects;

public sealed record ServiceCategoryId
{
    public ServiceCategoryId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ServiceCategoryId cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }

    public static ServiceCategoryId New() => new(Guid.NewGuid());
}
