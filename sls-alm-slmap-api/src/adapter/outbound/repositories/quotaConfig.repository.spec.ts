import { QuotaConfigRepository } from './quotaConfig.repository';
import { QuotaConfigEntity } from './entities/quotaConfig.entity';
import { Repository } from 'typeorm';

describe('QuotaConfigRepository', () => {
  let repository: QuotaConfigRepository;
  let mockQuotaConfigModel: jest.Mocked<Repository<QuotaConfigEntity>>;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    mockQuotaConfigModel = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    repository = new QuotaConfigRepository(mockQuotaConfigModel);
  });

  describe('getYearConfigs', () => {
    it('should return unique location types and quota types for a year', async () => {
      // Arrange
      const year = '2026';
      const mockRawData = [
        { locationType: '01', quotaType: '01' },
        { locationType: '02', quotaType: '02' },
        { locationType: '01', quotaType: '02' }, // Duplicate location type
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRawData);

      // Act
      const result = await repository.getYearConfigs(year);

      // Assert
      expect(mockQuotaConfigModel.createQueryBuilder).toHaveBeenCalledWith('qc');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'qc.location_type as "locationType"',
        'qc.quota_type as "quotaType"',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('qc.year = :year', { year });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'qc.is_visible = :isVisible',
        { isVisible: 'Y' },
      );
      expect(result).toEqual({
        year: '2026',
        locationTypes: ['01', '02'],
        quotaTypes: ['01', '02'],
      });
    });

    it('should return empty arrays when no data found', async () => {
      // Arrange
      const year = '2027';
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      const result = await repository.getYearConfigs(year);

      // Assert
      expect(result).toEqual({
        year: '2027',
        locationTypes: [],
        quotaTypes: [],
      });
    });

    it('should sort location types and quota types', async () => {
      // Arrange
      const year = '2026';
      const mockRawData = [
        { locationType: '03', quotaType: '03' },
        { locationType: '01', quotaType: '01' },
        { locationType: '02', quotaType: '02' },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRawData);

      // Act
      const result = await repository.getYearConfigs(year);

      // Assert
      expect(result.locationTypes).toEqual(['01', '02', '03']);
      expect(result.quotaTypes).toEqual(['01', '02', '03']);
    });

    it('should handle null values in location type or quota type', async () => {
      // Arrange
      const year = '2026';
      const mockRawData = [
        { locationType: '01', quotaType: '01' },
        { locationType: null, quotaType: '02' },
        { locationType: '02', quotaType: null },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRawData);

      // Act
      const result = await repository.getYearConfigs(year);

      // Assert
      expect(result.locationTypes).toEqual(['01', '02']);
      expect(result.quotaTypes).toEqual(['01', '02']);
    });
  });

  describe('getExistingPairs', () => {
    it('should return existing config pairs for a year', async () => {
      // Arrange
      const year = '2026';
      const mockRawData = [
        { id: 1, year: '2026', locationType: '01', quotaType: '01', isVisible: 'Y' },
        { id: 2, year: '2026', locationType: '02', quotaType: '02', isVisible: 'Y' },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRawData);

      // Act
      const result = await repository.getExistingPairs(year);

      // Assert
      expect(mockQuotaConfigModel.createQueryBuilder).toHaveBeenCalledWith('qc');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'qc.id as "id"',
        'qc.year as "year"',
        'qc.location_type as "locationType"',
        'qc.quota_type as "quotaType"',
        'qc.is_visible as "isVisible"',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('qc.year = :year', { year });
      expect(result).toEqual(mockRawData);
    });

    it('should return empty array when no pairs found', async () => {
      // Arrange
      const year = '2027';
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      const result = await repository.getExistingPairs(year);

      // Assert
      expect(result).toEqual([]);
    });

    it('should use queryRunner when provided', async () => {
      // Arrange
      const year = '2026';
      const mockQueryRunner = {
        manager: {
          createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        },
      } as any;
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      await repository.getExistingPairs(year, mockQueryRunner);

      // Assert
      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalledWith(
        expect.anything(),
        'qc',
      );
    });
  });

  describe('createConfig', () => {
    it('should create a new config and return its ID', async () => {
      // Arrange
      const year = '2026';
      const locationType = '01';
      const quotaType = '01';
      const userId = 1;
      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({
          identifiers: [{ id: 123 }],
        }),
      };
      mockQuotaConfigModel.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockInsertBuilder);

      // Act
      const result = await repository.createConfig(year, locationType, quotaType, userId);

      // Assert
      expect(mockInsertBuilder.insert).toHaveBeenCalled();
      expect(mockInsertBuilder.into).toHaveBeenCalled();
      expect(mockInsertBuilder.values).toHaveBeenCalledWith(
        expect.objectContaining({
          year,
          locationType,
          quotaType,
          isVisible: 'Y',
          createBy: userId,
        }),
      );
      expect(result).toBe(123);
    });

    it('should use queryRunner when provided', async () => {
      // Arrange
      const year = '2026';
      const locationType = '01';
      const quotaType = '01';
      const userId = 1;
      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({
          identifiers: [{ id: 456 }],
        }),
      };
      const mockQueryRunner = {
        manager: {
          createQueryBuilder: jest.fn().mockReturnValue(mockInsertBuilder),
        },
      } as any;

      // Act
      const result = await repository.createConfig(
        year,
        locationType,
        quotaType,
        userId,
        mockQueryRunner,
      );

      // Assert
      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBe(456);
    });
  });

  describe('updateVisibility', () => {
    it('should update config visibility', async () => {
      // Arrange
      const configId = 123;
      const isVisible = 'N';
      const userId = 1;
      const mockUpdateBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockQuotaConfigModel.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockUpdateBuilder);

      // Act
      await repository.updateVisibility(configId, isVisible, userId);

      // Assert
      expect(mockUpdateBuilder.update).toHaveBeenCalled();
      expect(mockUpdateBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible,
          updateBy: userId,
        }),
      );
      expect(mockUpdateBuilder.where).toHaveBeenCalledWith('id = :configId', {
        configId,
      });
    });

    it('should use queryRunner when provided', async () => {
      // Arrange
      const configId = 123;
      const isVisible = 'N';
      const userId = 1;
      const mockUpdateBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      const mockQueryRunner = {
        manager: {
          createQueryBuilder: jest.fn().mockReturnValue(mockUpdateBuilder),
        },
      } as any;

      // Act
      await repository.updateVisibility(configId, isVisible, userId, mockQueryRunner);

      // Assert
      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findConfigId', () => {
    it('should return config ID when found', async () => {
      // Arrange
      const year = '2026';
      const locationType = '01';
      const quotaType = '01';
      const mockFindBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ id: 789 }),
      };
      mockQuotaConfigModel.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFindBuilder);

      // Act
      const result = await repository.findConfigId(year, locationType, quotaType);

      // Assert
      expect(mockFindBuilder.select).toHaveBeenCalledWith('qc.id', 'id');
      expect(mockFindBuilder.where).toHaveBeenCalledWith('qc.year = :year', { year });
      expect(mockFindBuilder.andWhere).toHaveBeenCalledWith(
        'qc.location_type = :locationType',
        { locationType },
      );
      expect(mockFindBuilder.andWhere).toHaveBeenCalledWith(
        'qc.quota_type = :quotaType',
        { quotaType },
      );
      expect(result).toBe(789);
    });

    it('should return null when config not found', async () => {
      // Arrange
      const year = '2027';
      const locationType = '99';
      const quotaType = '99';
      const mockFindBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      mockQuotaConfigModel.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockFindBuilder);

      // Act
      const result = await repository.findConfigId(year, locationType, quotaType);

      // Assert
      expect(result).toBeNull();
    });

    it('should use queryRunner when provided', async () => {
      // Arrange
      const year = '2026';
      const locationType = '01';
      const quotaType = '01';
      const mockFindBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ id: 999 }),
      };
      const mockQueryRunner = {
        manager: {
          createQueryBuilder: jest.fn().mockReturnValue(mockFindBuilder),
        },
      } as any;

      // Act
      const result = await repository.findConfigId(
        year,
        locationType,
        quotaType,
        mockQueryRunner,
      );

      // Assert
      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBe(999);
    });
  });
});
