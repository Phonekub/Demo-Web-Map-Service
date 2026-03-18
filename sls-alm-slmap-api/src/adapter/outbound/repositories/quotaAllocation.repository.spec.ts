import { QuotaAllocationRepository } from './quotaAllocation.repository';
import { QuotaAllocationEntity } from './entities/quotaAllocation.entity';
import { QuotaAllocationItemEntity } from './entities/quotaAllocationItem.entity';
import { QuotaAllocationItemLogEntity } from './entities/quotaAllocationItemLog.entity';
import { PoiEntity } from './entities/poi.entity';
import { ElementSevenElevenEntity } from './entities/elementSevenEleven.entity';
import { Repository, DataSource } from 'typeorm';

describe('QuotaAllocationRepository', () => {
  let repository: QuotaAllocationRepository;
  let mockQuotaAllocationModel: jest.Mocked<Repository<QuotaAllocationEntity>>;
  let mockItemRepository: jest.Mocked<Repository<QuotaAllocationItemEntity>>;
  let mockItemLogRepository: jest.Mocked<Repository<QuotaAllocationItemLogEntity>>;
  let mockPoiRepository: jest.Mocked<Repository<PoiEntity>>;
  let mockElementSevenElevenRepository: jest.Mocked<Repository<ElementSevenElevenEntity>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    mockQuotaAllocationModel = {
      query: jest.fn(),
    } as any;

    mockItemRepository = {
      query: jest.fn(),
    } as any;

    mockItemLogRepository = {
      query: jest.fn(),
    } as any;

    mockPoiRepository = {
      query: jest.fn(),
    } as any;

    mockElementSevenElevenRepository = {
      query: jest.fn(),
    } as any;

    mockDataSource = {
      query: jest.fn(),
    } as any;

    repository = new QuotaAllocationRepository(
      mockQuotaAllocationModel,
      mockItemRepository,
      mockItemLogRepository,
      mockPoiRepository,
      mockElementSevenElevenRepository,
      mockDataSource,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByIdWithZoneAndWorkflowStatus', () => {
    it('should return allocation with zone and workflow completion status', async () => {
      // Arrange
      const id = 123;
      const mockResult = [
        {
          id: 123,
          zone: 'BKK',
          isCompleted: false,
        },
      ];
      mockQuotaAllocationModel.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(mockQuotaAllocationModel.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [123],
      );
      expect(mockQuotaAllocationModel.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM allmap.quota_allocation qa'),
        [123],
      );
      expect(mockQuotaAllocationModel.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE qa.id = $1'),
        [123],
      );
      expect(result).toEqual({
        id: 123,
        zone: 'BKK',
        isCompleted: false,
      });
    });

    it('should return allocation with completed workflow status', async () => {
      // Arrange
      const id = 456;
      const mockResult = [
        {
          id: 456,
          zone: 'CNX',
          isCompleted: true,
        },
      ];
      mockQuotaAllocationModel.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(result).toEqual({
        id: 456,
        zone: 'CNX',
        isCompleted: true,
      });
    });

    it('should return null when allocation not found', async () => {
      // Arrange
      const id = 999;
      mockQuotaAllocationModel.query.mockResolvedValue([]);

      // Act
      const result = await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when query returns null', async () => {
      // Arrange
      const id = 999;
      mockQuotaAllocationModel.query.mockResolvedValue(null);

      // Act
      const result = await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should default isCompleted to false when value is falsy', async () => {
      // Arrange
      const id = 123;
      const mockResult = [
        {
          id: 123,
          zone: 'BKK',
          isCompleted: null,
        },
      ];
      mockQuotaAllocationModel.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(result?.isCompleted).toBe(false);
    });

    it('should handle different zone codes', async () => {
      // Arrange
      const testCases = [
        { id: 1, zone: 'BKK' },
        { id: 2, zone: 'CNX' },
        { id: 3, zone: 'HDY' },
        { id: 4, zone: 'PKT' },
      ];

      for (const testCase of testCases) {
        mockQuotaAllocationModel.query.mockResolvedValueOnce([
          { ...testCase, isCompleted: false },
        ]);

        // Act
        const result = await repository.findByIdWithZoneAndWorkflowStatus(testCase.id);

        // Assert
        expect(result?.zone).toBe(testCase.zone);
      }

      expect(mockQuotaAllocationModel.query).toHaveBeenCalledTimes(testCases.length);
    });

    it('should query with workflow transaction wf_id = 5', async () => {
      // Arrange
      const id = 100;
      mockQuotaAllocationModel.query.mockResolvedValue([
        { id: 100, zone: 'BKK', isCompleted: false },
      ]);

      // Act
      await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(mockQuotaAllocationModel.query).toHaveBeenCalledWith(
        expect.stringContaining('wft.wf_id = 5'),
        [100],
      );
    });

    it('should check active workflow transactions', async () => {
      // Arrange
      const id = 100;
      mockQuotaAllocationModel.query.mockResolvedValue([
        { id: 100, zone: 'BKK', isCompleted: false },
      ]);

      // Act
      await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(mockQuotaAllocationModel.query).toHaveBeenCalledWith(
        expect.stringContaining("wft.is_active = 'Y'"),
        [100],
      );
    });

    it('should check workflow completion status', async () => {
      // Arrange
      const id = 100;
      mockQuotaAllocationModel.query.mockResolvedValue([
        { id: 100, zone: 'BKK', isCompleted: true },
      ]);

      // Act
      await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(mockQuotaAllocationModel.query).toHaveBeenCalledWith(
        expect.stringContaining("wfs.wf_complete = 'Y'"),
        [100],
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const id = 123;
      const error = new Error('Database connection failed');
      mockQuotaAllocationModel.query.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByIdWithZoneAndWorkflowStatus(id)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should join with zone table to get zone_code', async () => {
      // Arrange
      const id = 100;
      mockQuotaAllocationModel.query.mockResolvedValue([
        { id: 100, zone: 'BKK', isCompleted: false },
      ]);

      // Act
      await repository.findByIdWithZoneAndWorkflowStatus(id);

      // Assert
      expect(mockQuotaAllocationModel.query).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN allmap.zone z ON z.zone_id = qa.zone_id'),
        [100],
      );
    });
  });

  describe('getQuotaAllocationsForRoundStatusCheck', () => {
    it('should map query rows to expected shape and types', async () => {
      const mockRows = [
        {
          id: '1',
          wf_transaction_id: '10',
          wf_complete: 'Y',
          quota_assign: '2',
          annual_target: '0',
        },
        {
          id: '2',
          wf_transaction_id: null,
          wf_complete: null,
          quota_assign: null,
          annual_target: null,
        },
      ];
      mockDataSource.query.mockResolvedValueOnce(mockRows as any);

      const result = await repository.getQuotaAllocationsForRoundStatusCheck(55);

      expect(mockDataSource.query).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        wfTransactionId: 10,
        wfComplete: 'Y',
        quotaAssign: 2,
        annualTarget: 0,
      });
      expect(result[1]).toEqual({
        id: 2,
        wfTransactionId: null,
        wfComplete: null,
        quotaAssign: 0,
        annualTarget: null,
      });
    });

    it('should throw DataAccessException when query fails', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('boom'));

      await expect(
        repository.getQuotaAllocationsForRoundStatusCheck(99),
      ).rejects.toThrow();
    });
  });
});
