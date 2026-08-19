namespace CromaticaCreativa.Modules.Contact.Domain.ValueObjects;

public sealed record RequestedServiceReference
{
    public RequestedServiceReference(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("The requested service identifier cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }
}
