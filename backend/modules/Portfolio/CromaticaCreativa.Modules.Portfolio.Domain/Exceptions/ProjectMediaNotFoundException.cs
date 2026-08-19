using CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.Portfolio.Domain.Exceptions;

public sealed class ProjectMediaNotFoundException : InvalidOperationException
{
    public ProjectMediaNotFoundException(ProjectMediaId mediaId)
        : base($"Project media '{mediaId.Value}' does not belong to the project.")
    {
    }
}
