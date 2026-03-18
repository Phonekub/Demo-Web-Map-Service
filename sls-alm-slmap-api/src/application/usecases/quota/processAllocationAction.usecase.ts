import { Injectable } from '@nestjs/common';
import { QuotaAllocationWorkflowService } from './helpers/quotaAllocationWorkflow.service';

export interface ProcessAllocationActionInput {
  refId: number;
  actionCode: string;
  remark?: string;
  userId: number;
  userZones: string[];
  roleId: number;
}

export interface ProcessAllocationActionResult {
  success: boolean;
  message: string;
  data?: {
    refId: number;
    actionCode: string;
  };
}

@Injectable()
export class ProcessAllocationActionUseCase {
  constructor(private readonly workflowService: QuotaAllocationWorkflowService) {}

  async execute(
    input: ProcessAllocationActionInput,
  ): Promise<ProcessAllocationActionResult> {
    const { refId, actionCode, remark, userId, userZones } = input;

    // Validate input
    if (!refId || isNaN(refId)) {
      throw {
        code: 'BAD_REQUEST',
        message: 'refId must be a valid number.',
      };
    }

    if (!actionCode || actionCode.trim().length === 0) {
      throw {
        code: 'BAD_REQUEST',
        message: 'actionCode is required.',
      };
    }

    if (!userId) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'User authentication required.',
      };
    }

    const result = await this.workflowService.processAction({
      allocationId: refId,
      actionCode,
      userId,
      userZones,
      remark,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Processing failed.',
      };
    }

    return {
      success: true,
      message: `Action '${actionCode}' processed successfully.`,
      data: {
        refId,
        actionCode,
      },
    };
  }
}
