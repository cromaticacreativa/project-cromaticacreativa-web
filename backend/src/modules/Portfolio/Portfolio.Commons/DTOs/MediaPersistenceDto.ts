export type MediaPersistenceDto = {
  id: string;
  projectId: string;
  reference: string;
  type: string;
  displayOrder: number;
  isCover: boolean;
  coverProjectId: string | null;
};
