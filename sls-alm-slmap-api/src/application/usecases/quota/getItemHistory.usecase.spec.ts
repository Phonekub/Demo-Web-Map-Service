import { Test, TestingModule } from '@nestjs/testing';
import { GetItemHistoryUseCase } from './getItemHistory.usecase';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import { GetItemHistoryResponse } from '../../../domain/quotaAllocation';
import { DataAccessException } from '../../../common/exceptions/quota.exception';

describe('GetItemHistoryUseCase', () => {
  let useCase: GetItemHistoryUseCase;
  let quotaAllocationRepository: jest.Mocked<QuotaAllocationRepositoryPort>;

  beforeEach(async () => {
    const mockQuotaAllocationRepository = {
      getItemHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetItemHistoryUseCase,
        {
          provide: 'QuotaAllocationRepository',
          useValue: mockQuotaAllocationRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetItemHistoryUseCase>(GetItemHistoryUseCase);
    quotaAllocationRepository = module.get('QuotaAllocationRepository');
  });

  describe('execute', () => {
    it('should successfully retrieve item history', async () => {
      // Arrange
      const itemId = 123;
      const mockResponse: GetItemHistoryResponse = {
        history: [
          {
            detail: 'เปลี่ยนทำเลจาก [001] ร้านเก่า เป็น [002] ร้านใหม่',
            remark: 'ทำเลใหม่มีศักยภาพดีกว่า',
            created_by_name: 'John Doe',
            created_date: new Date('2026-02-18T10:30:00'),
          },
          {
            detail: 'เพิ่มทำเล [002] ร้านใหม่',
            remark: null,
            created_by_name: 'Jane Smith',
            created_date: new Date('2026-02-17T14:20:00'),
          },
        ],
      };

      quotaAllocationRepository.getItemHistory.mockResolvedValue(mockResponse);

      // Act
      const result = await useCase.execute(itemId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.history).toHaveLength(2);
      expect(result.history[0].detail).toContain('เปลี่ยนทำเล');
      expect(result.history[0].created_by_name).toBe('John Doe');
      expect(result.history[0].remark).toBe('ทำเลใหม่มีศักยภาพดีกว่า');
      expect(quotaAllocationRepository.getItemHistory).toHaveBeenCalledWith(itemId);
      expect(quotaAllocationRepository.getItemHistory).toHaveBeenCalledTimes(1);
    });

    it('should return empty history when item has no logs', async () => {
      // Arrange
      const itemId = 456;
      const mockResponse: GetItemHistoryResponse = {
        history: [],
      };

      quotaAllocationRepository.getItemHistory.mockResolvedValue(mockResponse);

      // Act
      const result = await useCase.execute(itemId);

      // Assert
      expect(result.history).toHaveLength(0);
      expect(quotaAllocationRepository.getItemHistory).toHaveBeenCalledWith(itemId);
    });

    it('should throw DataAccessException when repository fails', async () => {
      // Arrange
      const itemId = 789;
      quotaAllocationRepository.getItemHistory.mockRejectedValue(
        new Error('Database connection error'),
      );

      // Act & Assert
      await expect(useCase.execute(itemId)).rejects.toThrow(DataAccessException);
      await expect(useCase.execute(itemId)).rejects.toThrow(
        'Failed to retrieve history for item 789',
      );
    });

    it('should handle item not found error', async () => {
      // Arrange
      const itemId = 999;
      quotaAllocationRepository.getItemHistory.mockRejectedValue(
        new DataAccessException('Item 999 not found'),
      );

      // Act & Assert
      await expect(useCase.execute(itemId)).rejects.toThrow(DataAccessException);
      await expect(useCase.execute(itemId)).rejects.toThrow('Item 999 not found');
    });

    it('should handle history with null remarks', async () => {
      // Arrange
      const itemId = 111;
      const mockResponse: GetItemHistoryResponse = {
        history: [
          {
            detail: 'ลบทำเล [003] ร้านเดิม',
            remark: null,
            created_by_name: 'Admin User',
            created_date: new Date('2026-02-18T09:00:00'),
          },
        ],
      };

      quotaAllocationRepository.getItemHistory.mockResolvedValue(mockResponse);

      // Act
      const result = await useCase.execute(itemId);

      // Assert
      expect(result.history[0].remark).toBeNull();
      expect(result.history[0].detail).toContain('ลบทำเล');
    });

    it('should return history ordered by latest first', async () => {
      // Arrange
      const itemId = 222;
      const mockResponse: GetItemHistoryResponse = {
        history: [
          {
            detail: 'Latest change',
            remark: null,
            created_by_name: 'User 3',
            created_date: new Date('2026-02-18T15:00:00'),
          },
          {
            detail: 'Middle change',
            remark: 'Some remark',
            created_by_name: 'User 2',
            created_date: new Date('2026-02-18T12:00:00'),
          },
          {
            detail: 'Oldest change',
            remark: null,
            created_by_name: 'User 1',
            created_date: new Date('2026-02-18T09:00:00'),
          },
        ],
      };

      quotaAllocationRepository.getItemHistory.mockResolvedValue(mockResponse);

      // Act
      const result = await useCase.execute(itemId);

      // Assert
      expect(result.history[0].detail).toBe('Latest change');
      expect(result.history[1].detail).toBe('Middle change');
      expect(result.history[2].detail).toBe('Oldest change');
    });
  });
});
