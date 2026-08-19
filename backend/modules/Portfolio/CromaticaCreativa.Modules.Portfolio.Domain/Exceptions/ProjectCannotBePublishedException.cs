namespace CromaticaCreativa.Modules.Portfolio.Domain.Exceptions;

public sealed class ProjectCannotBePublishedException : InvalidOperationException
{
    public ProjectCannotBePublishedException()
        : base("A project must have a valid title before it can be published.")
    {
    }
}
