import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  QuotaAllocationRepositoryPort,
  QuotaAllocation,
} from '../../../ports/quotaAllocation.repository';
import { WorkflowApprovalUseCase } from '../../workflow/workflowApproval.usecase';
import { GetCurrentWorkflowStepUseCase } from '../../workflow/getCurrentWorkflowStep.usecase';
import { WorkflowSendMailUseCase } from '../../workflow/workflowSendMail.usecase';
import {
  buildQuotaEmailTemplateData,
  buildEmailConnection,
  allocationMeetsRoundCompletionCriteria,
} from './quotaWorkflowHelpers';
import { MasterRepositoryPort } from '../../../ports/master.repository';
import { Language } from '../../../../common/enums/language.enum';

export interface ProcessAllocationInput {
  allocationId: number;
  actionCode: string;
  userId: number;
  userZones: string[];
  remark?: string;
}

export interface ProcessAllocationResult {
  allocationId: number;
  success: boolean;
  message?: string;
}

const QUOTA_WORKFLOW_ID = 5;

@Injectable()
export class QuotaAllocationWorkflowService {
  private readonly logger = new Logger(QuotaAllocationWorkflowService.name);
  constructor(
    @Inject('QuotaAllocationRepository')
    private readonly quotaAllocationRepository: QuotaAllocationRepositoryPort,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async processAction(input: ProcessAllocationInput): Promise<ProcessAllocationResult> {
    const { allocationId, actionCode, userId, userZones, remark } = input;

    try {
      // 1. Fetch allocation data
      const allocation =
        await this.quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus(
          allocationId,
        );

      if (!allocation) {
        return {
          allocationId,
          success: false,
          message: `Allocation ID ${allocationId} not found.`,
        };
      }

      // 2. Check zone permission
      if (!userZones.includes(allocation.zone)) {
        return {
          allocationId,
          success: false,
          message: `Permission denied: You do not have access to zone ${allocation.zone}.`,
        };
      }

      // 3. Get current workflow step
      const workflowStep = await this.getCurrentWorkflowStepUseCase.handler(
        allocationId,
        [QUOTA_WORKFLOW_ID],
        userId,
      );

      if (!workflowStep.success || !workflowStep.data?.wfTransactionId) {
        return {
          allocationId,
          success: false,
          message: 'Workflow not found or not accessible.',
        };
      }

      // 4. Validate action is available
      const availableActions = workflowStep.data.availableActions || [];
      const isActionAvailable = availableActions.some(
        (a: any) => a.actionCode === actionCode,
      );

      if (!isActionAvailable) {
        return {
          allocationId,
          success: false,
          message: `Action '${actionCode}' is not available for this workflow step.`,
        };
      }

      // 5. Process workflow approval
      const approvalResult = await this.workflowApprovalUseCase.handler({
        refId: allocationId,
        wfTransactionId: workflowStep.data.wfTransactionId,
        approvalAction: actionCode,
        userId,
        remark,
        wfParameter: { QUOTA_LOCATION_TYPE: allocation.locationType },
      });

      if (!approvalResult.success) {
        return {
          allocationId,
          success: false,
          message: String(approvalResult.error?.message) || 'Workflow approval failed.',
        };
      }

      // 6. Send email notification
      await this.sendEmailNotification({
        wfTransactionId: workflowStep.data.wfTransactionId,
        emailDetailId: approvalResult.route?.wfEmailDetailId,
        actionCode,
        userId,
        allocation,
      });

      // 7. Check WF completion and update quota round status if needed
      try {
        const currentStepAfter = await this.getCurrentWorkflowStepUseCase.handler(
          allocation.id,
          [QUOTA_WORKFLOW_ID],
          userId,
        );

        const wfComplete = currentStepAfter.data?.wfStatus?.wfComplete;

        if (wfComplete && wfComplete !== 'W') {
          const quotaRoundId =
            await this.quotaAllocationRepository.getQuotaRoundIdByAllocationId(
              allocation.id,
            );

          if (quotaRoundId) {
            const allocations =
              await this.quotaAllocationRepository.getQuotaAllocationsForRoundStatusCheck(
                quotaRoundId,
              );

            const allMeet = allocations.every(allocationMeetsRoundCompletionCriteria);

            if (allMeet) {
              await this.quotaAllocationRepository.updateQuotaRoundStatus(
                quotaRoundId,
                3,
              );
            }
          }
        }
      } catch (e) {
        this.logger.error('Error while evaluating quota_round completion:', e as any);
      }

      return {
        allocationId,
        success: true,
      };
    } catch (error: any) {
      this.logger.error(
        `Error processing allocation ${allocationId}: ${error?.message || ''}`,
        error as any,
      );
      return {
        allocationId,
        success: false,
        message: String(error?.message || 'Data access error occurred.'),
      };
    }
  }

  private async sendEmailNotification(params: {
    wfTransactionId: number;
    emailDetailId?: number;
    actionCode: string;
    userId: number;
    allocation: QuotaAllocation;
  }): Promise<void> {
    const { wfTransactionId, emailDetailId, actionCode, userId, allocation } = params;

    if (!emailDetailId) {
      return;
    }

    try {
      // ดึงชื่อ LOCATION_TYPE จาก common_code
      let locationTypeName = '';
      if (allocation.locationType) {
        const code = await this.masterRepository.getCommonCodeName(
          'QUOTA_LOCATION_TYPE',
          Language.TH,
          allocation.locationType,
        );
        locationTypeName = code?.name || '';
      }
      await this.workflowSendMailUseCase.handler({
        wfTransactionId,
        emailDetailId,
        approvalAction: actionCode,
        userId,
        templateData: buildQuotaEmailTemplateData(allocation, locationTypeName),
        connection: buildEmailConnection(allocation.zone),
      });
    } catch (emailError) {
      this.logger.error('Email sending failed:', emailError as any);
      // Continue even if email fails - don't throw error
    }
  }
}
