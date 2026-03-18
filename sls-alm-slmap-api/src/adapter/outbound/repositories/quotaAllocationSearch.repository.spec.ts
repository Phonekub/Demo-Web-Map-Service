import { QuotaAllocationSearchRepository } from './quotaAllocationSearch.repository';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { QuotaSearchQuery } from '../../../domain/quotaSearch';

describe('QuotaAllocationSearchRepository', () => {
  let repository: QuotaAllocationSearchRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<any>>;

  beforeEach(() => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    } as any;

    mockDataSource = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    repository = new QuotaAllocationSearchRepository(mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchQuotas', () => {
    it('should return quota search results with user zone filter', async () => {
      // Arrange
      const query: QuotaSearchQuery = { year: '2026' };
      const userZones = ['BKK', 'CNX'];
      const mockResults = [
        {
          id: 1,
          year: '2026',
          locationTypeName: 'Type A',
          quotaTypeName: 'Quota X',
          round: 'Round 1',
          zone: 'BKK',
          keyed: 10,
          quota: 100,
          statusName: 'Pending',
        },
        {
          id: 2,
          year: '2026',
          locationTypeName: 'Type B',
          quotaTypeName: 'Quota Y',
          round: 'Round 1',
          zone: 'CNX',
          keyed: 5,
          quota: 50,
          statusName: 'Approved',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      // Act
      const result = await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockDataSource.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'z.zone_code IN (:...userZones)',
        { userZones },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('qc.year = :year', {
        year: '2026',
      });
      expect(result).toEqual([mockResults]);
    });

    it('should apply year filter correctly', async () => {
      // Arrange
      const query: QuotaSearchQuery = { year: '2025' };
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('qc.year = :year', {
        year: '2025',
      });
    });

    it('should apply location type filter', async () => {
      // Arrange
      const query: QuotaSearchQuery = { locationType: '01' };
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'qc.location_type = :locationType',
        { locationType: '01' },
      );
    });

    it('should apply quota type filter', async () => {
      // Arrange
      const query: QuotaSearchQuery = { quotaType: '02' };
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'qc.quota_type = :quotaType',
        {
          quotaType: '02',
        },
      );
    });

    it('should apply round filter with ILIKE', async () => {
      // Arrange
      const query: QuotaSearchQuery = { round: 'Round 1' };
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('qr.name ILIKE :round', {
        round: '%Round 1%',
      });
    });

    it('should apply zone filter', async () => {
      // Arrange
      const query: QuotaSearchQuery = { zone: 'CNX' };
      const userZones = ['BKK', 'CNX', 'HDY'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('z.zone_code = :zone', {
        zone: 'CNX',
      });
    });

    it('should apply status filter', async () => {
      // Arrange
      const query: QuotaSearchQuery = { status: '3' };
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('wfs.id = :statusId', {
        statusId: 3,
      });
    });

    it('should apply pending only filter with userId', async () => {
      // Arrange
      const query: QuotaSearchQuery = { pendingOnly: true };
      const userZones = ['BKK'];
      const userId = 123;
      const roleId = 5;
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones, userId, roleId);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('wft.approve_type'),
        { userId: '123', roleId: '5' },
      );
    });

    it('should not apply pending filter when userId and roleId are missing', async () => {
      // Arrange
      const query: QuotaSearchQuery = { pendingOnly: true };
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      const calls = (mockQueryBuilder.andWhere as jest.Mock).mock.calls;
      const hasPendingFilter = calls.some((call) =>
        call[0]?.includes('wft.approve_type'),
      );
      expect(hasPendingFilter).toBe(false);
    });

    it('should apply multiple filters together', async () => {
      // Arrange
      const query: QuotaSearchQuery = {
        year: '2026',
        locationType: '01',
        quotaType: '02',
        round: 'Round 2',
        zone: 'BKK',
        status: '1',
      };
      const userZones = ['BKK', 'CNX'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('qc.year = :year', {
        year: '2026',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'qc.location_type = :locationType',
        { locationType: '01' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'qc.quota_type = :quotaType',
        {
          quotaType: '02',
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('qr.name ILIKE :round', {
        round: '%Round 2%',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('z.zone_code = :zone', {
        zone: 'BKK',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('wfs.id = :statusId', {
        statusId: 1,
      });
    });

    it('should return empty array when no results found', async () => {
      // Arrange
      const query: QuotaSearchQuery = { year: '2030' };
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      const result = await repository.searchQuotas(query, userZones);

      // Assert
      expect(result).toEqual([[]]);
    });

    it('should not apply zone filter when userZones is empty', async () => {
      // Arrange
      const query: QuotaSearchQuery = { year: '2026' };
      const userZones: string[] = [];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      const calls = (mockQueryBuilder.andWhere as jest.Mock).mock.calls;
      const hasZoneFilter = calls.some((call) => call[0]?.includes('z.zone_code IN'));
      expect(hasZoneFilter).toBe(false);
    });

    it('should apply ordering by year DESC, seq ASC, zone_code ASC', async () => {
      // Arrange
      const query: QuotaSearchQuery = {};
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('qc.year', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('qr.seq', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('z.zone_code', 'ASC');
    });

    it('should join with workflow transaction for wf_id = 5', async () => {
      // Arrange
      const query: QuotaSearchQuery = {};
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'wf_transaction',
        'wft',
        'wft.wf_id = 5 AND wft.ref_id = qa.id AND wft.is_active = :isActive',
        { isActive: 'Y' },
      );
    });

    it('should count keyed items with type = MAIN', async () => {
      // Arrange
      const query: QuotaSearchQuery = {};
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'quota_allocation_item',
        'qai',
        "qai.quota_allocation_id = qa.id AND qai.type = 'MAIN'",
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('COUNT(qai.id)')]),
      );
    });

    it('should map raw results to QuotaSearch objects', async () => {
      // Arrange
      const query: QuotaSearchQuery = {};
      const userZones = ['BKK'];
      const mockRawResults = [
        {
          id: 100,
          year: '2026',
          locationTypeName: 'Location A',
          quotaTypeName: 'Quota B',
          round: 'Round 3',
          zone: 'BKK',
          keyed: 15,
          quota: 150,
          statusName: 'In Review',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRawResults);

      // Act
      const result = await repository.searchQuotas(query, userZones);

      // Assert
      expect(result[0]).toEqual([
        {
          id: 100,
          year: '2026',
          locationTypeName: 'Location A',
          quotaTypeName: 'Quota B',
          round: 'Round 3',
          zone: 'BKK',
          keyed: 15,
          quota: 150,
          statusName: 'In Review',
        },
      ]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const query: QuotaSearchQuery = { year: '2026' };
      const userZones = ['BKK'];
      const error = new Error('Database connection failed');
      mockQueryBuilder.getRawMany.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.searchQuotas(query, userZones)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should skip empty string filters', async () => {
      // Arrange
      const query: QuotaSearchQuery = {
        year: '',
        locationType: '',
        quotaType: '',
        round: '',
        zone: '',
      };
      const userZones = ['BKK'];
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.searchQuotas(query, userZones);

      // Assert
      const calls = (mockQueryBuilder.andWhere as jest.Mock).mock.calls;
      // Should only have userZones filter, not the empty string filters
      expect(calls.length).toBe(1);
      expect(calls[0][0]).toContain('z.zone_code IN');
    });

    it('should handle null keyed count', async () => {
      // Arrange
      const query: QuotaSearchQuery = {};
      const userZones = ['BKK'];
      const mockRawResults = [
        {
          id: 1,
          year: '2026',
          locationTypeName: 'Type A',
          quotaTypeName: 'Quota X',
          round: 'Round 1',
          zone: 'BKK',
          keyed: null, // No items keyed yet
          quota: 100,
          statusName: 'Pending',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRawResults);

      // Act
      const result = await repository.searchQuotas(query, userZones);

      // Assert
      expect(result[0][0].keyed).toBeNull();
    });

    it('should handle null statusName when no workflow transaction', async () => {
      // Arrange
      const query: QuotaSearchQuery = {};
      const userZones = ['BKK'];
      const mockRawResults = [
        {
          id: 1,
          year: '2026',
          locationTypeName: 'Type A',
          quotaTypeName: 'Quota X',
          round: 'Round 1',
          zone: 'BKK',
          keyed: 0,
          quota: 100,
          statusName: null, // No workflow yet
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRawResults);

      // Act
      const result = await repository.searchQuotas(query, userZones);

      // Assert
      expect(result[0][0].statusName).toBeNull();
    });
  });
});
