import { CorporateClientId } from '../ValueObjects/CorporateClientId';
import { DisplayOrder } from '../ValueObjects/DisplayOrder';
import { ProjectCategoryReference } from '../ValueObjects/ProjectCategoryReference';
import { ProjectId } from '../ValueObjects/ProjectId';
import { ProjectPeriod } from '../ValueObjects/ProjectPeriod';
import { ProjectServiceReference } from '../ValueObjects/ProjectServiceReference';
import { ProjectTitle } from '../ValueObjects/ProjectTitle';

export interface ICreateProjectParameters {
  id: ProjectId;
  description?: string | null;
  service: ProjectServiceReference;
  category: ProjectCategoryReference;
  period: ProjectPeriod;
  order: DisplayOrder;
  title?: ProjectTitle | null;
  corporateClientId?: CorporateClientId | null;
}
