import { Test, TestingModule } from '@nestjs/testing';
import { GetZoneAnnualTargetsByYearUseCase } from './getZoneAnnualTargetsByYear.usecase';
import { QuotaAnnualTargetRepositoryPort } from '../../ports/quotaAnnualTarget.repository';
import { DataAccessException } from '../../../common/exceptions/quota.exception';

describe('GetZoneAnnualTargetsByYearUseCase', () => {
  let useCase: GetZoneAnnualTargetsByYearUseCase;
  let repository: jest.Mocked<QuotaAnnualTargetRepositoryPort>;

  beforeEach(async () => {
    const mockRepository = {
      getZoneAnnualTargetsByYear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetZoneAnnualTargetsByYearUseCase,
        {
          provide: 'QuotaAnnualTargetRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetZoneAnnualTargetsByYearUseCase>(
      GetZoneAnnualTargetsByYearUseCase,
    );
    repository = module.get('QuotaAnnualTargetRepository');
  });

  describe('execute', () => {
    it('should return zone annual targets with year', async () => {
      const mockItems = [
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

      repository.getZoneAnnualTargetsByYear.mockResolvedValue(mockItems);

      const result = await useCase.execute('2026');

      expect(result).toEqual({
        year: '2026',
        items: mockItems,
      });
      expect(repository.getZoneAnnualTargetsByYear).toHaveBeenCalledWith('2026');
    });

    it('should return empty items array when no data found', async () => {
      repository.getZoneAnnualTargetsByYear.mockResolvedValue([]);

      const result = await useCase.execute('2027');

      expect(result).toEqual({
        year: '2027',
        items: [],
      });
    });

    it('should throw INVALID_YEAR_FORMAT for 2-digit year', async () => {
      await expect(useCase.execute('26')).rejects.toThrow('Invalid quota year format');

      try {
        await useCase.execute('26');
      } catch (error) {
        expect(error.code).toBe('INVALID_YEAR_FORMAT');
      }
    });

    it('should throw INVALID_YEAR_FORMAT for non-numeric year', async () => {
      await expect(useCase.execute('abcd')).rejects.toThrow('Invalid quota year format');

      try {
        await useCase.execute('abcd');
      } catch (error) {
        expect(error.code).toBe('INVALID_YEAR_FORMAT');
      }
    });

    it('should throw INVALID_YEAR_FORMAT for 5-digit year', async () => {
      await expect(useCase.execute('20266')).rejects.toThrow('Invalid quota year format');

      try {
        await useCase.execute('20266');
      } catch (error) {
        expect(error.code).toBe('INVALID_YEAR_FORMAT');
      }
    });

    it('should throw DataAccessException when repository fails', async () => {
      const error = new DataAccessException(
        'Failed to get zone annual targets: Database connection failed',
      );
      repository.getZoneAnnualTargetsByYear.mockRejectedValue(error);

      await expect(useCase.execute('2026')).rejects.toThrow(DataAccessException);
      await expect(useCase.execute('2026')).rejects.toMatchObject({
        code: 'DATA_ACCESS_ERROR',
        message: 'Failed to get zone annual targets: Database connection failed',
      });
    });

    it('should re-throw INVALID_YEAR_FORMAT from repository', async () => {
      const validationError = new Error('Invalid quota year format');
      (validationError as any).code = 'INVALID_YEAR_FORMAT';
      repository.getZoneAnnualTargetsByYear.mockRejectedValue(validationError);

      await expect(useCase.execute('2026')).rejects.toThrow('Invalid quota year format');

      try {
        await useCase.execute('2026');
      } catch (error) {
        expect(error.code).toBe('INVALID_YEAR_FORMAT');
      }
    });
  });
});
