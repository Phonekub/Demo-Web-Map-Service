import { Injectable, Inject } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';
import { Language } from '../../../common/enums/language.enum';

export interface DropdownOption {
  value: string;
  text: string;
}

export interface WorkflowStepOption extends DropdownOption {
  stepOwnerType: string;
  stepOwnerRole: string;
  stepOwnerUser: string;
}

@Injectable()
export class GetWorkflowStepsUseCase {
  constructor(
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
  ) {}

  async handler(wfId: number, language: Language): Promise<WorkflowStepOption[]> {
    const steps = await this.workflowRepository.findWorkflowStepsByWfId(wfId);

    return steps.map((step) => ({
      value: step.id.toString(),
      text:
        language === Language.TH
          ? step.wfStepNameTH
          : language === Language.KM
            ? step.wfStepNameKH
            : step.wfStepNameEN,
      stepOwnerType: step.stepOwnerType,
      stepOwnerRole: step.stepOwnerRole ?? '',
      stepOwnerUser: step.stepOwnerUser ?? '',
    }));
  }
}
