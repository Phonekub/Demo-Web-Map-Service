import { Injectable } from '@nestjs/common';
import { QuotaAllocationWorkflowService } from './helpers/quotaAllocationWorkflow.service';

export interface RejectSelectedInput {
  ids: number[];
  reason: string;
  userId: number;
  userZones: string[];
  roleId: number;
}

export interface RejectSelectedResult {
  id: number;
  success: boolean;
  message?: string;
}

@Injectable()
export class RejectSelectedUseCase {
  constructor(private readonly workflowService: QuotaAllocationWorkflowService) {}

  async execute(input: RejectSelectedInput): Promise<RejectSelectedResult[]> {
    const { ids, reason, userId, userZones } = input;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw {
        code: 'BAD_REQUEST',
        message: 'Request body must contain a non-empty array of IDs.',
      };
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw {
        code: 'BAD_REQUEST',
        message: 'Reason is required and must be a non-empty string.',
      };
    }

    if (!userId) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'User authentication required.',
      };
    }

    // Process all allocations in parallel for better performance
    const processPromises = ids.map((id) =>
      this.workflowService.processAction({
        allocationId: id,
        actionCode: 'REJECT',
        userId,
        userZones,
        remark: reason,
      }),
    );

    const results = await Promise.all(processPromises);

    // Map results to expected format
    return results.map((result) => ({
      id: result.allocationId,
      success: result.success,
      message: result.message,
    }));
  }
}
