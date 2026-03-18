import { Injectable, Inject } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';

@Injectable()
export class UpdateWfStepOwnerUseCase {
  constructor(
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
  ) {}

  async handler(
    stepId: number,
    stepOwnerType: string,
    stepOwnerRole: string,
    stepOwnerUser: string,
    updatedBy: number,
  ): Promise<void> {
    await this.workflowRepository.updateWfStepOwner(
      stepId,
      stepOwnerType,
      stepOwnerRole,
      stepOwnerUser,
      updatedBy,
    );
  }
}
