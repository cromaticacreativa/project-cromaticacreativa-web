export class ProjectMediaAlreadyAttachedException extends Error {
  public constructor(mediaId: string) {
    super(`El medio '${mediaId}' ya está asociado al proyecto.`);
    this.name = 'ProjectMediaAlreadyAttachedException';
  }
}
