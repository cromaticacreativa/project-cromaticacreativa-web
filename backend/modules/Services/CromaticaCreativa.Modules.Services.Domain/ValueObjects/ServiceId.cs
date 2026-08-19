namespace CromaticaCreativa.Modules.Services.Domain.ValueObjects;

public sealed record ServiceId
{
    public ServiceId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ServiceId cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }

    public static ServiceId New() => new(Guid.NewGuid());
}
