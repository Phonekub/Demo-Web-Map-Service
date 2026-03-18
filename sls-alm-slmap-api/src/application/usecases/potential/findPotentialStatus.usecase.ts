import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { WorkflowType } from '../../../common/enums/workflow.enum';
import { WorkflowAction } from '@common/enums/action.enum';

@Injectable()
export class FindPotentialStatusUsecase {
  constructor(
    @Inject('PoiRepository') private readonly poiRepository: PoiRepositoryPort,
    @Inject('BackupProfileRepository')
    private readonly backupProfileRepository: BackupProfileRepositoryPort,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
  ) {}

  async handler(poiId: number, userId: number) {
    const backupProfile = await this.backupProfileRepository.findByPoiId(poiId);
    if (!backupProfile) {
      return {
        success: false,
      };
    }

    const potential = await this.poiRepository.findPotentialStoreById(poiId);

    if (!potential?.wfTransactionId) {
      throw new BadRequestException('Workflow transaction not found');
    }

    const workflow = await this.getCurrentWorkflowStepUseCase.handler(
      potential.id,
      [
        WorkflowType.POTENTIAL_PREPARATORY,
        WorkflowType.POTENTIAL_EDIT,
        WorkflowType.POTENTIAL_DELETE,
      ],
      userId,
    );

    if (workflow.data?.availableActions.length === 0) {
      return { success: false };
    }

    const hasSendApprovalAction = workflow.data.availableActions.some(
      (action) => action.actionCode === WorkflowAction.SEND_APPROVE,
    );

    if (!hasSendApprovalAction) {
      return { success: false };
    }

    return workflow;
  }
}
