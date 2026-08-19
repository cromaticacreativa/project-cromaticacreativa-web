namespace CromaticaCreativa.Modules.CompanyProfile.Domain.Exceptions;

public sealed class InvalidGeoCoordinatesException : ArgumentOutOfRangeException
{
    public InvalidGeoCoordinatesException(double latitude, double longitude)
        : base(nameof(latitude), $"Coordinates ({latitude}, {longitude}) are outside the valid latitude/longitude ranges.")
    {
    }
}
