using CromaticaCreativa.Modules.Contact.Domain.Enums;
using CromaticaCreativa.Modules.Contact.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.Contact.Domain.Aggregates;

public sealed class ContactRequest
{
    private ContactRequest(
        ContactRequestId id,
        PersonName applicantName,
        string? companyName,
        EmailAddress email,
        PhoneNumber phone,
        RequestType type,
        RequestedServiceReference service,
        string? message)
    {
        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(nameof(type), type, "Unknown request type.");
        }

        Id = id ?? throw new ArgumentNullException(nameof(id));
        ApplicantName = applicantName ?? throw new ArgumentNullException(nameof(applicantName));
        CompanyName = NormalizeOptional(companyName);
        Email = email ?? throw new ArgumentNullException(nameof(email));
        Phone = phone ?? throw new ArgumentNullException(nameof(phone));
        Type = type;
        Service = service ?? throw new ArgumentNullException(nameof(service));
        Message = NormalizeOptional(message);
    }

    public ContactRequestId Id { get; }

    public PersonName ApplicantName { get; }

    public string? CompanyName { get; }

    public EmailAddress Email { get; }

    public PhoneNumber Phone { get; }

    public RequestType Type { get; }

    public RequestedServiceReference Service { get; }

    public string? Message { get; }

    public static ContactRequest Create(
        ContactRequestId id,
        PersonName applicantName,
        string? companyName,
        EmailAddress email,
        PhoneNumber phone,
        RequestType type,
        RequestedServiceReference service,
        string? message) =>
        new(id, applicantName, companyName, email, phone, type, service, message);

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
