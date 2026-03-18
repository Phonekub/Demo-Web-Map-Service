import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotaAnnualTargetRepository } from './quotaAnnualTarget.repository';
import { QuotaAnnualTargetEntity } from './entities/quotaAnnualTarget.entity';

describe('QuotaAnnualTargetRepository', () => {
  let repository: QuotaAnnualTargetRepository;
  let typeOrmRepository: Repository<QuotaAnnualTargetEntity>;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaAnnualTargetRepository,
        {
          provide: getRepositoryToken(QuotaAnnualTargetEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            manager: mockManager,
          },
        },
      ],
    }).compile();

    repository = module.get<QuotaAnnualTargetRepository>(QuotaAnnualTargetRepository);
    typeOrmRepository = module.get<Repository<QuotaAnnualTargetEntity>>(
      getRepositoryToken(QuotaAnnualTargetEntity),
    );
  });

  describe('getZoneAnnualTargetsByYear', () => {
    it('should return zone annual targets for a given year', async () => {
      const mockData = [
        {
          id: 1,
          quotaConfigId: 1,
          locationType: '01',
          quotaType: '01',
          zoneId: 1,
          target: 50,
        },
        {
          id: 2,
          quotaConfigId: 1,
          locationType: '01',
          quotaType: '01',
          zoneId: 2,
          target: 45,
        },
      ];

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockData),
      };

      jest
        .spyOn(typeOrmRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await repository.getZoneAnnualTargetsByYear('2026');

      expect(result).toEqual(mockData);
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'quota_config',
        'qc',
        'qat.quota_config_id = qc.id',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('qc.year = :year', {
        year: '2026',
      });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('qat.zone_id', 'ASC');
    });

    it('should return empty array when no data found', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(typeOrmRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const result = await repository.getZoneAnnualTargetsByYear('2027');

      expect(result).toEqual([]);
    });

    it('should throw DATA_ACCESS_ERROR when database fails', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockRejectedValue(new Error('DB Error')),
      };

      jest
        .spyOn(typeOrmRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await expect(repository.getZoneAnnualTargetsByYear('2026')).rejects.toThrow(
        'Failed to get zone annual targets',
      );

      try {
        await repository.getZoneAnnualTargetsByYear('2026');
      } catch (error) {
        expect(error.code).toBe('DATA_ACCESS_ERROR');
      }
    });
  });

  describe('upsertZoneTargets', () => {
    it('should upsert multiple zone targets successfully', async () => {
      // Arrange
      const zonesTarget = [
        { quotaConfigId: 1, zoneId: 1, target: 100 },
        { quotaConfigId: 1, zoneId: 2, target: 150 },
      ];
      const userId = 1;

      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orUpdate: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }, { id: 2 }] }),
      };

      jest
        .spyOn(typeOrmRepository, 'createQueryBuilder')
        .mockReturnValue(mockInsertBuilder as any);

      // Act
      await repository.upsertZoneTargets(zonesTarget, userId);

      // Assert
      expect(mockInsertBuilder.insert).toHaveBeenCalled();
      expect(mockInsertBuilder.into).toHaveBeenCalledWith(QuotaAnnualTargetEntity);
      expect(mockInsertBuilder.values).toHaveBeenCalled();
    });

    it('should use queryRunner when provided', async () => {
      // Arrange
      const zonesTarget = [{ quotaConfigId: 1, zoneId: 1, target: 100 }];
      const userId = 1;

      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orUpdate: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
      };

      const mockQueryRunner = {
        manager: {
          createQueryBuilder: jest.fn().mockReturnValue(mockInsertBuilder),
        },
      } as any;

      // Act
      await repository.upsertZoneTargets(zonesTarget, userId, mockQueryRunner);

      // Assert
      expect(mockQueryRunner.manager.createQueryBuilder).toHaveBeenCalled();
    });

    it('should throw DATA_ACCESS_ERROR when database fails', async () => {
      // Arrange
      const zonesTarget = [{ quotaConfigId: 1, zoneId: 1, target: 100 }];
      const userId = 1;

      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orUpdate: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('DB Error')),
      };

      jest
        .spyOn(typeOrmRepository, 'createQueryBuilder')
        .mockReturnValue(mockInsertBuilder as any);

      // Act & Assert
      await expect(repository.upsertZoneTargets(zonesTarget, userId)).rejects.toThrow(
        'Failed to upsert zone targets',
      );

      try {
        await repository.upsertZoneTargets(zonesTarget, userId);
      } catch (error) {
        expect(error.code).toBe('DATA_ACCESS_ERROR');
      }
    });
  });
});
