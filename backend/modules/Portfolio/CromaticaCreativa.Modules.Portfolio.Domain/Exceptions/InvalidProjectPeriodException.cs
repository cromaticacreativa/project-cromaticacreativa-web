namespace CromaticaCreativa.Modules.Portfolio.Domain.Exceptions;

public sealed class InvalidProjectPeriodException : ArgumentException
{
    public InvalidProjectPeriodException(DateOnly startDate, DateOnly endDate)
        : base($"Project end date '{endDate:yyyy-MM-dd}' cannot precede start date '{startDate:yyyy-MM-dd}'.")
    {
    }
}
