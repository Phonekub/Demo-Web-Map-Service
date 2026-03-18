import { Test, TestingModule } from '@nestjs/testing';
import { SaveAnnualQuotaUseCase } from './saveAnnualQuota.usecase';
import { QuotaConfigRepositoryPort } from '../../ports/quotaConfig.repository';
import { QuotaAnnualTargetRepositoryPort } from '../../ports/quotaAnnualTarget.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { SaveAnnualQuotaRequest } from '../../../domain/quotaAnnualTarget';
import { Dropdown } from '../../../domain/dropdown';
import { DataSource, QueryRunner } from 'typeorm';

describe('SaveAnnualQuotaUseCase', () => {
  let useCase: SaveAnnualQuotaUseCase;
  let quotaConfigRepository: jest.Mocked<QuotaConfigRepositoryPort>;
  let quotaAnnualTargetRepository: jest.Mocked<QuotaAnnualTargetRepositoryPort>;
  let masterRepository: jest.Mocked<MasterRepositoryPort>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {} as any,
    } as any;

    const mockQuotaConfigRepository = {
      getExistingPairs: jest.fn(),
      createConfig: jest.fn(),
      updateVisibility: jest.fn(),
      findConfigId: jest.fn(),
    };

    const mockQuotaAnnualTargetRepository = {
      getZoneAnnualTargetsByYear: jest.fn(),
      upsertZoneTargets: jest.fn(),
    };

    const mockMasterRepository = {
      getCommonCode: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveAnnualQuotaUseCase,
        {
          provide: 'QuotaConfigRepository',
          useValue: mockQuotaConfigRepository,
        },
        {
          provide: 'QuotaAnnualTargetRepository',
          useValue: mockQuotaAnnualTargetRepository,
        },
        {
          provide: 'MasterRepository',
          useValue: mockMasterRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    useCase = module.get<SaveAnnualQuotaUseCase>(SaveAnnualQuotaUseCase);
    quotaConfigRepository = module.get('QuotaConfigRepository');
    quotaAnnualTargetRepository = module.get('QuotaAnnualTargetRepository');
    masterRepository = module.get('MasterRepository');
  });

  describe('execute', () => {
    const userId = 1;

    it('should successfully save quota configs and zone targets', async () => {
      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01', '02'],
        quotaTypes: ['01'],
        zoneTargets: [
          { zoneId: 1, locationType: '01', quotaType: '01', target: 100 },
          { zoneId: 2, locationType: '02', quotaType: '01', target: 150 },
        ],
      };

      const mockLocationTypes: Dropdown[] = [
        { text: 'Type 1', value: '01' },
        { text: 'Type 2', value: '02' },
      ];
      const mockQuotaTypes: Dropdown[] = [{ text: 'Quota 1', value: '01' }];

      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      quotaConfigRepository.getExistingPairs
        .mockResolvedValueOnce([]) // first call - get existing (empty)
        .mockResolvedValueOnce([
          // second call - after creating configs
          { id: 1, locationType: '01', quotaType: '01', isVisible: 'Y', year: '2026' },
          { id: 2, locationType: '02', quotaType: '01', isVisible: 'Y', year: '2026' },
        ]);
      quotaConfigRepository.createConfig.mockResolvedValueOnce(1);
      quotaConfigRepository.createConfig.mockResolvedValueOnce(2);
      quotaAnnualTargetRepository.upsertZoneTargets.mockResolvedValue();

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(masterRepository.getCommonCode).toHaveBeenCalledWith(
        'QUOTA_LOCATION_TYPE',
        'en',
      );
      expect(masterRepository.getCommonCode).toHaveBeenCalledWith('QUOTA_TYPE', 'en');
      expect(quotaConfigRepository.createConfig).toHaveBeenCalledTimes(2);
      expect(quotaAnnualTargetRepository.upsertZoneTargets).toHaveBeenCalledTimes(1);
      expect(quotaAnnualTargetRepository.upsertZoneTargets).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ quotaConfigId: 1, zoneId: 1, target: 100 }),
          expect.objectContaining({ quotaConfigId: 2, zoneId: 2, target: 150 }),
        ]),
        userId,
        mockQueryRunner,
      );
    });

    it('should return error when year format is invalid', async () => {
      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '26',
        locationTypes: ['01'],
        quotaTypes: ['01'],
      };

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'INVALID_YEAR_FORMAT',
        message: 'Invalid quota year format',
      });
      expect(masterRepository.getCommonCode).not.toHaveBeenCalled();
    });

    it('should return error when location types not found in catalog', async () => {
      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01', '99'],
        quotaTypes: ['01'],
      };

      const mockLocationTypes: Dropdown[] = [{ text: 'Type 1', value: '01' }];
      masterRepository.getCommonCode.mockResolvedValue(mockLocationTypes);

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CATALOG_NOT_FOUND');
      expect(result.error?.message).toContain('Location types not found');
      expect(result.error?.message).toContain('99');
    });

    it('should return error when quota types not found in catalog', async () => {
      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01', '99'],
      };

      const mockLocationTypes: Dropdown[] = [{ text: 'Type 1', value: '01' }];
      const mockQuotaTypes: Dropdown[] = [{ text: 'Quota 1', value: '01' }];

      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CATALOG_NOT_FOUND');
      expect(result.error?.message).toContain('Quota types not found');
      expect(result.error?.message).toContain('99');
    });

    it('should return error when zone target is negative', async () => {
      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
        zoneTargets: [{ zoneId: 1, locationType: '01', quotaType: '01', target: -10 }],
      };

      const mockLocationTypes: Dropdown[] = [{ text: 'Type 1', value: '01' }];
      const mockQuotaTypes: Dropdown[] = [{ text: 'Quota 1', value: '01' }];

      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NEGATIVE_TARGET');
      expect(result.error?.message).toContain('cannot be negative');
    });

    it('should show existing hidden configs when selected again', async () => {
      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
      };

      const mockLocationTypes: Dropdown[] = [{ text: 'Type 1', value: '01' }];
      const mockQuotaTypes: Dropdown[] = [{ text: 'Quota 1', value: '01' }];

      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      quotaConfigRepository.getExistingPairs.mockResolvedValue([
        {
          id: 1,
          year: '2026',
          locationType: '01',
          quotaType: '01',
          isVisible: 'N',
        },
      ]);
      quotaConfigRepository.updateVisibility.mockResolvedValue();

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(quotaConfigRepository.createConfig).not.toHaveBeenCalled();
      expect(quotaConfigRepository.updateVisibility).toHaveBeenCalledWith(
        1,
        'Y',
        userId,
        expect.anything(), // queryRunner
      );
    });

    it('should hide existing visible configs when deselected', async () => {
      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['02'],
        quotaTypes: ['01'],
      };

      const mockLocationTypes: Dropdown[] = [
        { text: 'Type 1', value: '01' },
        { text: 'Type 2', value: '02' },
      ];
      const mockQuotaTypes: Dropdown[] = [{ text: 'Quota 1', value: '01' }];

      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      quotaConfigRepository.getExistingPairs.mockResolvedValue([
        {
          id: 1,
          year: '2026',
          locationType: '01',
          quotaType: '01',
          isVisible: 'Y',
        },
        {
          id: 2,
          year: '2026',
          locationType: '02',
          quotaType: '01',
          isVisible: 'N',
        },
      ]);
      quotaConfigRepository.updateVisibility.mockResolvedValue();

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(quotaConfigRepository.updateVisibility).toHaveBeenCalledWith(
        1,
        'N',
        userId,
        expect.anything(), // queryRunner
      );
      expect(quotaConfigRepository.updateVisibility).toHaveBeenCalledWith(
        2,
        'Y',
        userId,
        expect.anything(), // queryRunner
      );
    });

    it('should return error when config not found for zone target', async () => {
      const userId = 1;

      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
        zoneTargets: [{ zoneId: 1, locationType: '02', quotaType: '01', target: 100 }],
      };

      const mockLocationTypes: Dropdown[] = [{ text: 'Type 1', value: '01' }];
      const mockQuotaTypes: Dropdown[] = [{ text: 'Quota 1', value: '01' }];

      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      quotaConfigRepository.getExistingPairs.mockResolvedValue([]);
      quotaConfigRepository.createConfig.mockResolvedValue(1);
      quotaConfigRepository.findConfigId.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PAIR_NOT_SELECTED');
      expect(result.error?.message).toContain('Configuration not found');
    });

    it('should handle empty zone targets array', async () => {
      const userId = 1;

      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
        zoneTargets: [],
      };

      const mockLocationTypes: Dropdown[] = [{ text: 'Type 1', value: '01' }];
      const mockQuotaTypes: Dropdown[] = [{ text: 'Quota 1', value: '01' }];

      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      quotaConfigRepository.getExistingPairs.mockResolvedValue([]);
      quotaConfigRepository.createConfig.mockResolvedValue(1);

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(quotaAnnualTargetRepository.upsertZoneTargets).not.toHaveBeenCalled();
    });

    it('should handle undefined zone targets', async () => {
      const userId = 1;

      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
      };

      const mockLocationTypes: Dropdown[] = [{ text: 'Type 1', value: '01' }];
      const mockQuotaTypes: Dropdown[] = [{ text: 'Quota 1', value: '01' }];

      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      quotaConfigRepository.getExistingPairs.mockResolvedValue([]);
      quotaConfigRepository.createConfig.mockResolvedValue(1);

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(quotaAnnualTargetRepository.upsertZoneTargets).not.toHaveBeenCalled();
    });

    it('should handle data access error from repository', async () => {
      const userId = 1;

      // Arrange
      const request: SaveAnnualQuotaRequest = {
        year: '2026',
        locationTypes: ['01'],
        quotaTypes: ['01'],
      };

      const error = new Error('Database connection failed');
      (error as any).code = 'DATA_ACCESS_ERROR';

      masterRepository.getCommonCode.mockRejectedValue(error);

      // Act
      const result = await useCase.execute(request, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DATA_ACCESS_ERROR');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
