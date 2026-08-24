export class ProjectMediaNotFoundException extends Error {
  public constructor(mediaId: string) {
    super(`El medio '${mediaId}' no pertenece al proyecto.`);
    this.name = 'ProjectMediaNotFoundException';
  }
}
