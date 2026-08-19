using CromaticaCreativa.Modules.CompanyProfile.Domain.Exceptions;

namespace CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

public readonly record struct GeoCoordinates
{
    public GeoCoordinates(double latitude, double longitude)
    {
        if (double.IsNaN(latitude) ||
            double.IsNaN(longitude) ||
            latitude is < -90 or > 90 ||
            longitude is < -180 or > 180)
        {
            throw new InvalidGeoCoordinatesException(latitude, longitude);
        }

        Latitude = latitude;
        Longitude = longitude;
    }

    public double Latitude { get; }

    public double Longitude { get; }
}
