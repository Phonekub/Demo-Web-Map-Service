import { MasterRepository } from './master.repository';
import { Repository } from 'typeorm';
import { CommonCodeEntity } from './entities/commonCode.entity';
import { GeoLocationEntity } from './entities/geoLocation.entity';
import { ZoneEntity } from './entities/zone.entity';
import { ReportConfigEntity } from './entities/reportConfig.entity';
import { ReportFieldEntity } from './entities/reportField.entity';
import { ImportConfigEntity } from './entities/importConfig.entity';
import { ImportFieldEntity } from './entities/importField.entity';
import { ZoneMaster } from '../../../domain/zoneMaster';

describe('MasterRepository - getZones', () => {
  let repository: MasterRepository;
  let mockCommonCodeRepo: jest.Mocked<Repository<CommonCodeEntity>>;
  let mockGeoLocationRepo: jest.Mocked<Repository<GeoLocationEntity>>;
  let mockReportConfigRepo: jest.Mocked<Repository<ReportConfigEntity>>;
  let mockReportFieldRepo: jest.Mocked<Repository<ReportFieldEntity>>;
  let mockZoneRepo: jest.Mocked<Repository<ZoneEntity>>;
  let mockImportConfigRepo: jest.Mocked<Repository<ImportConfigEntity>>;
  let mockImportFieldRepo: jest.Mocked<Repository<ImportFieldEntity>>;
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Create mock query builder
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };

    // Create mock repositories
    mockCommonCodeRepo = {
      createQueryBuilder: jest.fn(),
    } as any;

    mockGeoLocationRepo = {
      createQueryBuilder: jest.fn(),
    } as any;

    mockReportConfigRepo = {
      createQueryBuilder: jest.fn(),
    } as any;

    mockReportFieldRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockZoneRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    mockImportConfigRepo = {
      createQueryBuilder: jest.fn(),
    } as any;

    mockImportFieldRepo = {
      createQueryBuilder: jest.fn(),
    } as any;

    repository = new MasterRepository(
      mockCommonCodeRepo,
      mockGeoLocationRepo,
      mockReportConfigRepo,
      mockReportFieldRepo,
      mockZoneRepo,
      mockImportConfigRepo,
      mockImportFieldRepo,
    );
  });

  describe('getZones', () => {
    it('should return zones filtered by orgId and category', async () => {
      // Arrange
      const mockResults = [
        {
          zoneId: 1,
          zoneCode: 'ZONE001',
          category: 'MAIN',
          region: 'Central',
        },
        {
          zoneId: 2,
          zoneCode: 'ZONE002',
          category: 'MAIN',
          region: 'North',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      // Act
      const result = await repository.getZones('2', 'MAIN');

      // Assert
      expect(mockZoneRepo.createQueryBuilder).toHaveBeenCalledWith('zone');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'zone.zone_id as "zoneId"',
        'zone.zone_code as "zoneCode"',
        'zone.category as "category"',
        'zone.region as "region"',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('zone.org_id = :orgId', {
        orgId: '2',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'zone.is_active = :isActive',
        { isActive: 'Y' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'zone.category = :category',
        { category: 'MAIN' },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('zone.zone_code', 'ASC');
      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(2);
    });

    it('should return zones filtered by orgId only when category is not provided', async () => {
      // Arrange
      const mockResults = [
        {
          zoneId: 1,
          zoneCode: 'ZONE001',
          category: 'MAIN',
          region: 'Central',
        },
        {
          zoneId: 2,
          zoneCode: 'ZONE002',
          category: 'SUB',
          region: 'North',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      // Act
      const result = await repository.getZones('2');

      // Assert
      expect(mockZoneRepo.createQueryBuilder).toHaveBeenCalledWith('zone');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('zone.org_id = :orgId', {
        orgId: '2',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'zone.is_active = :isActive',
        { isActive: 'Y' },
      );
      // Should NOT filter by category
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'zone.category = :category',
        expect.anything(),
      );
      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no zones found', async () => {
      // Arrange
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      const result = await repository.getZones('999', 'MAIN');

      // Assert
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return zones ordered by zone_code ASC', async () => {
      // Arrange
      const mockResults = [
        { zoneId: 2, zoneCode: 'ZONE002', category: 'MAIN', region: 'Central' },
        { zoneId: 1, zoneCode: 'ZONE001', category: 'MAIN', region: 'North' },
        { zoneId: 3, zoneCode: 'ZONE003', category: 'MAIN', region: 'South' },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      // Act
      const result = await repository.getZones('2', 'MAIN');

      // Assert
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('zone.zone_code', 'ASC');
      expect(result).toEqual(mockResults);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockQueryBuilder.getRawMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.getZones('2', 'MAIN')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
