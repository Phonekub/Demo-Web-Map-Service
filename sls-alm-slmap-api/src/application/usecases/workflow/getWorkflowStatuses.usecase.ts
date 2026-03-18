import { Injectable, Inject } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';
import { Language } from '../../../common/enums/language.enum';

export interface DropdownOption {
  value: string;
  text: string;
}

@Injectable()
export class GetWorkflowStatusesUseCase {
  constructor(
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
  ) {}

  async handler(wfId: number, language: Language): Promise<DropdownOption[]> {
    const statuses = await this.workflowRepository.findWorkflowStatusesByWfId(wfId);

    return statuses.map((status) => ({
      value: status.wfStatusId.toString(),
      text: language === Language.TH ? status.wfStatusNameTh : status.wfStatusNameEn,
    }));
  }
}
