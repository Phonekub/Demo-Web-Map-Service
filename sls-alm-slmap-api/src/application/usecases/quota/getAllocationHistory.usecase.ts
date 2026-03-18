import { Inject, Injectable } from '@nestjs/common';
import { GetWorkflowHistoryUseCase } from '../workflow/getWorkflowHistory.usecase';
import { QuotaAllocationHistoryResponse } from '../../../domain/quotaSearch';
import { QuotaException } from '../../../common/exceptions/quota.exception';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';

export interface GetAllocationHistoryInput {
  id: number;
  userId: number;
  userZones: string[];
}

@Injectable()
export class GetAllocationHistoryUseCase {
  constructor(
    private readonly getWorkflowHistoryUseCase: GetWorkflowHistoryUseCase,
    @Inject('QuotaAllocationRepository')
    private readonly quotaAllocationRepository: QuotaAllocationRepositoryPort,
  ) {}

  async execute(
    input: GetAllocationHistoryInput,
  ): Promise<QuotaAllocationHistoryResponse> {
    const { id, userId, userZones } = input;

    // Validate input
    if (!id || id <= 0) {
      throw new QuotaException('BAD_REQUEST', 'Invalid allocation ID');
    }

    // Validate user authentication
    if (!userId) {
      throw new QuotaException('UNAUTHORIZED', 'User authentication required');
    }

    // Check if allocation exists and get zone info
    const allocation =
      await this.quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus(id);

    if (!allocation) {
      throw new QuotaException('NOT_FOUND', 'Allocation not found or has been deleted');
    }

    // Check zone permission
    if (!userZones || !userZones.includes(allocation.zone)) {
      throw new QuotaException(
        'FORBIDDEN',
        'You do not have permission to access this zone',
      );
    }

    // Get workflow history
    try {
      const workflowHistory = await this.getWorkflowHistoryUseCase.handler(id, 5);

      if (!workflowHistory.success) {
        throw new QuotaException(
          workflowHistory.error?.code || 'DATA_ACCESS_ERROR',
          workflowHistory.error?.message || 'Failed to retrieve workflow history',
        );
      }

      // Map and sort workflow history (latest first)
      const histories = workflowHistory.data?.histories || [];
      const data = histories
        .sort(
          (a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime(),
        )
        .map((history, index) => ({
          sequence: index + 1,
          statusName: history.wfStatus.wfStatusName,
          action: history.wfAction.wfActionName,
          remark: history.remark || null,
          actionBy: history.createBy.name,
          actionDate: this.formatDate(history.createDate),
        }));

      return { data };
    } catch (error) {
      if (error instanceof QuotaException) {
        throw error;
      }
      throw new QuotaException(
        'DATA_ACCESS_ERROR',
        'An error occurred while accessing allocation history.',
      );
    }
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}
