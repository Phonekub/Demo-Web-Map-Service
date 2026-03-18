import { Inject, Injectable } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';

export interface WorkflowAction {
  actionCode: string;
  actionName: string;
  requireRemark: boolean;
  isOwner: boolean;
}

export interface CurrentWorkflowStepData {
  wfTransactionId: number;
  wfStep: {
    wfStepId: number;
    wfStepName: string;
  };
  wfStatus: {
    wfStatusId: number;
    wfStatusName: string;
    wfComplete: 'W' | 'D' | 'C' | 'N' | 'Y';
  };
  canAction: boolean;
  availableActions: WorkflowAction[];
}

export interface CurrentWorkflowStepResponse {
  success: boolean;
  data?: CurrentWorkflowStepData;
  error?: {
    code: string;
    message: unknown;
  };
}

@Injectable()
export class GetCurrentWorkflowStepUseCase {
  constructor(
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
  ) {}

  async handler(
    refId: number,
    wfId: number[],
    userId: number,
    language?: string,
  ): Promise<{
    success: boolean;
    error?: { code: string; message: unknown };
    data?: CurrentWorkflowStepData;
  }> {
    if (!refId) {
      throw new Error('refId is required');
    }

    try {
      const result = await this.workflowRepository.getCurrentWorkflowStep(
        refId,
        wfId,
        userId,
        language,
      );

      if (!result) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ไม่พบข้อมูล workflow step ปัจจุบัน',
          },
        };
      }

      return {
        success: true,
        data: {
          wfTransactionId: result.transactionId,
          wfStep: {
            wfStepId: result.wfStepId,
            wfStepName: result.stepName,
          },
          wfStatus: {
            wfStatusId: result.wfStatusId,
            wfStatusName: result.statusName,
            wfComplete: result.wfComplete,
          },
          canAction: result.canAction,
          availableActions: result.actions,
        },
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: e,
        },
      };
    }
  }

  async getWorkflowTransaction(wfTransactionId: number) {
    return await this.workflowRepository.getWorkflowTransactionById(wfTransactionId);
  }
}
