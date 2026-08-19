namespace CromaticaCreativa.Modules.Contact.Domain.ValueObjects;

public sealed record ContactRequestId
{
    public ContactRequestId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ContactRequestId cannot be empty.", nameof(value));
        }

        Value = value;
    }

    public Guid Value { get; }

    public static ContactRequestId New() => new(Guid.NewGuid());
}
