import { Injectable } from '@nestjs/common';
import { QuotaAllocationWorkflowService } from './helpers/quotaAllocationWorkflow.service';

export interface ApproveSelectedInput {
  ids: number[];
  userId: number;
  userZones: string[];
  roleId: number;
}

export interface ApproveSelectedResult {
  id: number;
  success: boolean;
  message?: string;
}

@Injectable()
export class ApproveSelectedUseCase {
  constructor(private readonly workflowService: QuotaAllocationWorkflowService) {}

  async execute(input: ApproveSelectedInput): Promise<ApproveSelectedResult[]> {
    const { ids, userId, userZones } = input;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw {
        code: 'BAD_REQUEST',
        message: 'Request body must be a non-empty array of IDs.',
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
        actionCode: 'APPROVE',
        userId,
        userZones,
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
