export class ProjectCannotBePublishedException extends Error {
  public constructor() {
    super('El proyecto debe tener un título válido antes de poder publicarse.');
    this.name = 'ProjectCannotBePublishedException';
  }
}
