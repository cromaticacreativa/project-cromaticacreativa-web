using CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.CompanyProfile.Domain.Entities;

public sealed class CompanyLocation
{
    internal CompanyLocation(
        CompanyLocationId id,
        Address address,
        GeoCoordinates? coordinates)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        Address = address ?? throw new ArgumentNullException(nameof(address));
        Coordinates = coordinates;
    }

    public CompanyLocationId Id { get; }

    public Address Address { get; private set; }

    public GeoCoordinates? Coordinates { get; private set; }

    internal void Change(Address address, GeoCoordinates? coordinates)
    {
        Address = address ?? throw new ArgumentNullException(nameof(address));
        Coordinates = coordinates;
    }
}
