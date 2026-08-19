namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public readonly record struct DisplayOrder
{
    public DisplayOrder(int value)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(value), value, "Display order cannot be negative.");
        }

        Value = value;
    }

    public int Value { get; }
}
