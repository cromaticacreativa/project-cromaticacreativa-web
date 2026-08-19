using CromaticaCreativa.Modules.Portfolio.Domain.Exceptions;

namespace CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

public sealed record ProjectPeriod
{
    public ProjectPeriod(DateOnly startDate, DateOnly endDate)
    {
        if (endDate < startDate)
        {
            throw new InvalidProjectPeriodException(startDate, endDate);
        }

        StartDate = startDate;
        EndDate = endDate;
    }

    public DateOnly StartDate { get; }

    public DateOnly EndDate { get; }

    public int TotalDays => EndDate.DayNumber - StartDate.DayNumber;
}
