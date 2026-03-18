import { Test, TestingModule } from '@nestjs/testing';
import { SaveLocationSelectionUseCase } from './saveLocationSelection.usecase';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import { SaveLocationSelectionRequest } from '../../../domain/quotaAllocation';
import { QuotaException } from '../../../common/exceptions/quota.exception';

describe('SaveLocationSelectionUseCase', () => {
  let useCase: SaveLocationSelectionUseCase;
  let quotaAllocationRepository: jest.Mocked<QuotaAllocationRepositoryPort>;

  beforeEach(async () => {
    const mockQuotaAllocationRepository = {
      saveLocationSelection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveLocationSelectionUseCase,
        {
          provide: 'QuotaAllocationRepository',
          useValue: mockQuotaAllocationRepository,
        },
      ],
    }).compile();

    useCase = module.get<SaveLocationSelectionUseCase>(SaveLocationSelectionUseCase);
    quotaAllocationRepository = module.get('QuotaAllocationRepository');
  });

  describe('execute', () => {
    const userId = 1;

    it('should successfully save location selection with main operations only', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_add: [
                {
                  seq: 1,
                  poi_id: 1001,
                  open_type: '1',
                  open_month: '01',
                },
              ],
              to_update: [
                {
                  item_id: 10,
                  seq: 2,
                  poi_id: 1002,
                  open_type: '2',
                  open_month: '02',
                },
              ],
              to_replace: [
                {
                  item_id: 11,
                  seq: 3,
                  poi_id: 1003,
                  open_type: '1',
                  open_month: '03',
                },
              ],
              to_delete: [12, 13],
            },
          },
        ],
      };

      quotaAllocationRepository.saveLocationSelection.mockResolvedValue(undefined);

      // Act
      await useCase.execute(request, userId);

      // Assert
      expect(quotaAllocationRepository.saveLocationSelection).toHaveBeenCalledWith(
        request,
        userId,
      );
      expect(quotaAllocationRepository.saveLocationSelection).toHaveBeenCalledTimes(1);
    });

    it('should successfully save location selection with reserve operations', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_add: [
                {
                  seq: 1,
                  poi_id: 1001,
                  open_type: '1',
                  open_month: '01',
                },
              ],
            },
          },
        ],
        reserve: {
          to_add: [
            {
              seq: 1,
              poi_id: 1100,
            },
          ],
          to_replace: [
            {
              item_id: 20,
              seq: 2,
              poi_id: 1101,
            },
          ],
        },
      };

      quotaAllocationRepository.saveLocationSelection.mockResolvedValue(undefined);

      // Act
      await useCase.execute(request, userId);

      // Assert
      expect(quotaAllocationRepository.saveLocationSelection).toHaveBeenCalledWith(
        request,
        userId,
      );
    });

    it('should return error when allocations array is empty', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [],
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toBe('At least one allocation is required');
      expect(quotaAllocationRepository.saveLocationSelection).not.toHaveBeenCalled();
    });

    it('should return error when allocation_id is missing', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: undefined as any,
            main: {
              to_add: [
                {
                  seq: 1,
                  poi_id: 1001,
                  open_type: '1',
                  open_month: '01',
                },
              ],
            },
          },
        ],
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toBe('Allocation ID is required');
    });

    it('should return error when main operations are missing', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: undefined as any,
          },
        ],
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain('Main operations are required');
    });

    it('should return error when to_add item is missing required fields', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_add: [
                {
                  seq: 1,
                  poi_id: 1001,
                  open_type: undefined as any,
                  open_month: '01',
                },
              ],
            },
          },
        ],
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain(
        'seq, poi_id, open_type, and open_month are required',
      );
    });

    it('should return error when to_update item is missing item_id', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_update: [
                {
                  item_id: undefined as any,
                  seq: 1,
                  poi_id: 1001,
                  open_type: '1',
                  open_month: '01',
                },
              ],
            },
          },
        ],
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain(
        'item_id, seq, poi_id, open_type, and open_month are required',
      );
    });

    it('should return error when to_replace item is missing required fields', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_replace: [
                {
                  item_id: 10,
                  seq: undefined as any,
                  poi_id: 1001,
                  open_type: '1',
                  open_month: '01',
                },
              ],
            },
          },
        ],
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain(
        'item_id, seq, poi_id, open_type, and open_month are required',
      );
    });

    it('should return error when reserve to_add is missing required fields', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_add: [],
            },
          },
        ],
        reserve: {
          to_add: [
            {
              seq: undefined as any,
              poi_id: 1100,
            },
          ],
        },
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain('seq and poi_id are required');
    });

    it('should return error when reserve to_replace is missing required fields', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_add: [],
            },
          },
        ],
        reserve: {
          to_replace: [
            {
              item_id: 20,
              seq: undefined as any,
              poi_id: 1100,
            },
          ],
        },
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain('item_id, seq, and poi_id are required');
    });

    it('should handle multiple allocations in one request', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_add: [
                {
                  seq: 1,
                  poi_id: 1001,
                  open_type: '1',
                  open_month: '01',
                },
              ],
            },
          },
          {
            allocation_id: 2,
            main: {
              to_add: [
                {
                  seq: 1,
                  poi_id: 1002,
                  open_type: '2',
                  open_month: '02',
                },
              ],
            },
          },
        ],
      };

      quotaAllocationRepository.saveLocationSelection.mockResolvedValue(undefined);

      // Act
      await useCase.execute(request, userId);

      // Assert
      expect(quotaAllocationRepository.saveLocationSelection).toHaveBeenCalledWith(
        request,
        userId,
      );
    });

    it('should handle empty operations arrays without throwing error', async () => {
      // Arrange
      const request: SaveLocationSelectionRequest = {
        allocations: [
          {
            allocation_id: 1,
            main: {
              to_add: [],
              to_update: [],
              to_replace: [],
              to_delete: [],
            },
          },
        ],
      };

      quotaAllocationRepository.saveLocationSelection.mockResolvedValue(undefined);

      // Act
      await useCase.execute(request, userId);

      // Assert
      expect(quotaAllocationRepository.saveLocationSelection).toHaveBeenCalledWith(
        request,
        userId,
      );
    });
  });
});
