import { Inject, Injectable, Logger } from '@nestjs/common';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import {
  SaveLocationSelectionRequest,
  SaveLocationSelectionResponse,
} from '../../../domain/quotaAllocation';
import {
  QuotaException,
  DataAccessException,
} from '../../../common/exceptions/quota.exception';

@Injectable()
export class SaveLocationSelectionUseCase {
  private readonly logger = new Logger(SaveLocationSelectionUseCase.name);

  constructor(
    @Inject('QuotaAllocationRepository')
    private readonly quotaAllocationRepository: QuotaAllocationRepositoryPort,
  ) {}

  async execute(
    request: SaveLocationSelectionRequest,
    userId: number,
  ): Promise<SaveLocationSelectionResponse> {
    try {
      this.logger.log(
        `Saving location selection for ${request.allocations.length} allocations by user ${userId}`,
      );

      // Validate request
      this.validateRequest(request);

      // Save to database
      await this.quotaAllocationRepository.saveLocationSelection(request, userId);

      this.logger.log('Location selection saved successfully');

      return {
        success: true,
        message: 'Location selection saved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to save location selection', error);

      if (error instanceof QuotaException) {
        return {
          success: false,
          message: 'Failed to save location selection',
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      throw new DataAccessException(error.message || 'Failed to save location selection');
    }
  }

  private validateRequest(request: SaveLocationSelectionRequest): void {
    // Validate allocations
    if (!request.allocations || request.allocations.length === 0) {
      throw new QuotaException('INVALID_REQUEST', 'At least one allocation is required');
    }

    // Validate each allocation
    for (const allocation of request.allocations) {
      if (!allocation.allocation_id) {
        throw new QuotaException('INVALID_REQUEST', 'Allocation ID is required');
      }

      if (!allocation.main) {
        throw new QuotaException(
          'INVALID_REQUEST',
          `Main operations are required for allocation ${allocation.allocation_id}`,
        );
      }

      // Validate main operations
      this.validateMainOperations(allocation);
    }

    // Validate reserve operations if present
    if (request.reserve) {
      this.validateReserveOperations(request.reserve);
    }
  }

  private validateMainOperations(allocation: any): void {
    const { main } = allocation;

    // Validate to_add
    if (main.to_add) {
      for (const item of main.to_add) {
        if (!item.seq || !item.poi_id || !item.open_type || !item.open_month) {
          throw new QuotaException(
            'INVALID_REQUEST',
            'seq, poi_id, open_type, and open_month are required for adding new main location',
          );
        }
      }
    }

    // Validate to_update
    if (main.to_update) {
      for (const item of main.to_update) {
        if (
          !item.item_id ||
          !item.seq ||
          !item.poi_id ||
          !item.open_type ||
          !item.open_month
        ) {
          throw new QuotaException(
            'INVALID_REQUEST',
            'item_id, seq, poi_id, open_type, and open_month are required for updating main location',
          );
        }
      }
    }

    // Validate to_replace
    if (main.to_replace) {
      for (const item of main.to_replace) {
        if (
          !item.item_id ||
          !item.seq ||
          !item.poi_id ||
          !item.open_type ||
          !item.open_month
        ) {
          throw new QuotaException(
            'INVALID_REQUEST',
            'item_id, seq, poi_id, open_type, and open_month are required for replacing main location',
          );
        }
      }
    }

    // Validate to_delete
    if (main.to_delete) {
      for (const itemId of main.to_delete) {
        if (!itemId) {
          throw new QuotaException(
            'INVALID_REQUEST',
            'Valid item_id is required for deleting main location',
          );
        }
      }
    }
  }

  private validateReserveOperations(reserve: any): void {
    // Validate to_add
    if (reserve.to_add) {
      for (const item of reserve.to_add) {
        if (!item.seq || !item.poi_id) {
          throw new QuotaException(
            'INVALID_REQUEST',
            'seq and poi_id are required for adding new reserve location',
          );
        }
      }
    }

    // Validate to_replace
    if (reserve.to_replace) {
      for (const item of reserve.to_replace) {
        if (!item.item_id || !item.seq || !item.poi_id) {
          throw new QuotaException(
            'INVALID_REQUEST',
            'item_id, seq, and poi_id are required for replacing reserve location',
          );
        }
      }
    }

    // Validate to_delete
    if (reserve.to_delete) {
      for (const itemId of reserve.to_delete) {
        if (!itemId) {
          throw new QuotaException(
            'INVALID_REQUEST',
            'Valid item_id is required for deleting reserve location',
          );
        }
      }
    }
  }
}
