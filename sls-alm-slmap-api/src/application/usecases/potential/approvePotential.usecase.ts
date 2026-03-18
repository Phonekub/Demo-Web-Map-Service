import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
import { GetPotentialDetailUseCase } from './getPotentialDetail.usecase';
import { CreateRentalFormLocUseCase } from './createRentalFormLoc.usecase';
import {
  WorkflowSendMailUseCase,
  WorkflowSendMailUseCasePayload,
} from '../workflow/workflowSendMail.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { WorkflowAction } from '../../../common/enums/action.enum';
import { ApproveStatus, PotentialStatus } from '../../../common/enums/potential.enum';
import { Builder } from 'builder-pattern';
import { Potential } from 'src/domain/potential';

export interface ApprovePotentialPayload {
  poiId: number;
  approvalAction: string;
  userId: number;
  remark?: string;
}

export interface ApprovePotentialResult {
  status: 'success' | 'error';
  message?: string;
  error?: any;
}

@Injectable()
export class ApprovePotentialUsecase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
    @Inject('BackupProfileRepository')
    private readonly backupProfileRepository: BackupProfileRepositoryPort,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly getPotentialDetailUseCase: GetPotentialDetailUseCase,
    private readonly createRentalFormLocUseCase: CreateRentalFormLocUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(payload: ApprovePotentialPayload): Promise<ApprovePotentialResult> {
    const { poiId, approvalAction, userId, remark } = payload;

    try {
      // Get potential to retrieve wfTransactionId
      const potential = await this.getPotentialDetailUseCase.handler(poiId);

      if (!potential.potentialStore?.wfTransactionId) {
        return {
          status: 'error',
          message: 'Workflow transaction not found',
        };
      }

      // Validate backup profile exists
      const backupLocation =
        await this.backupProfileRepository.getBackupLocationByPoiId(poiId);

      if (!backupLocation) {
        throw new BadRequestException('Not found Backup Location');
      }

      // Send data to Rental API first when action is APPROVE
      if (approvalAction === 'APPROVE') {
        const rentalResult = await this.createRentalFormLocUseCase.handler({
          poiId: poiId,
          updateUserId: userId,
          approvalAction: approvalAction,
        });

        if (!rentalResult.success) {
          console.error('Rental API failed:', rentalResult.error);

          return {
            status: 'error',
            message: `Failed to send data to Rental API: ${rentalResult.message}`,
            error: rentalResult.error,
          };
        }
      }

      // Execute workflow approval after successful Rental API call (or for non-APPROVE actions)
      const workflowApproval = await this.workflowApprovalUseCase.handler({
        refId: +potential.potentialStore.id,
        wfTransactionId: potential.potentialStore.wfTransactionId,
        approvalAction: approvalAction,
        userId: userId,
        remark: remark,
      });

      // Send email notification for all approval actions
      if (workflowApproval?.route?.wfEmailDetailId) {
        try {
          const template = {
            LAYER_NAME: 'Potential Store',
            STEP_NAME: workflowApproval.route.wfStep.wfStepNameTH || 'อนุมัติ',
            LOG_REMARK: remark || '-',
            POI_ID: poiId.toString(),
            ZONE: potential.poi?.zoneCode || '-',
            SUB_ZONE: potential.poi?.subzoneCode || '-',
            KEY_FIELD: `ชื่อสถานที่: ${potential.poi?.namt || '-'}`,
            STORE_NAME: potential.poi?.namt || '-',
            POTENTIAL_ID: potential.potentialStore.id.toString(),
            LINK: process.env.BASE_URL_WEB || '',
          };

          const sendMailPayload = Builder<WorkflowSendMailUseCasePayload>()
            .wfTransactionId(potential.potentialStore.wfTransactionId)
            .emailDetailId(workflowApproval.route.wfEmailDetailId)
            .approvalAction(approvalAction)
            .userId(userId)
            .templateData(template)
            .build();

          await this.workflowSendMailUseCase.handler(sendMailPayload);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the whole process if email fails
        }
      }

      // Update potential status based on action
      if (approvalAction !== WorkflowAction.SAVE) {
        const actionMap = new Map([
          [WorkflowAction.SEND_APPROVE, PotentialStatus.WAITING_APPROVE],
          [WorkflowAction.REJECT, PotentialStatus.PRE_POTENTIAL],
          [WorkflowAction.NOT_APPROVE, PotentialStatus.NOT_APPROVE],
          [WorkflowAction.APPROVE, PotentialStatus.APPROVED],
        ]);

        const approveStatusMap = new Map([
          [WorkflowAction.SEND_APPROVE, ApproveStatus.WAITING_TO_SEND_APPROVE],
          [WorkflowAction.REJECT, ApproveStatus.SEND_BACK_TO_EDIT],
          [WorkflowAction.NOT_APPROVE, ApproveStatus.NOT_APPROVE],
          [WorkflowAction.APPROVE, ApproveStatus.APPROVED],
        ]);

        const status = actionMap.get(approvalAction as WorkflowAction);
        const approveStatus = approveStatusMap.get(approvalAction as WorkflowAction);
        if (status && approveStatus && potential.potentialStore) {
          const potentialData = Builder<Potential>()
            .status(status)
            .approveStatus(approveStatus)
            .build();
          await this.poiRepository.updatePotentialStore(poiId, potentialData);
        }
      }

      return { status: 'success' };
    } catch (err) {
      return {
        status: 'error',
        message: err.message || err,
      };
    }
  }
}
