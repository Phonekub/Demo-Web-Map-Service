import { Test, TestingModule } from '@nestjs/testing';
import { GetYearConfigsUseCase } from './getYearConfigs.usecase';
import { QuotaConfigRepositoryPort } from '../../ports/quotaConfig.repository';
import { YearConfigsResponse } from '../../../domain/quotaConfig';
import { DataAccessException } from '../../../common/exceptions/quota.exception';

describe('GetYearConfigsUseCase', () => {
  let useCase: GetYearConfigsUseCase;
  let repository: jest.Mocked<QuotaConfigRepositoryPort>;

  beforeEach(async () => {
    const mockRepository = {
      getYearConfigs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetYearConfigsUseCase,
        {
          provide: 'QuotaConfigRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetYearConfigsUseCase>(GetYearConfigsUseCase);
    repository = module.get('QuotaConfigRepository');
  });

  describe('execute', () => {
    it('should return year configs when repository returns data', async () => {
      // Arrange
      const year = '2026';
      const mockResponse: YearConfigsResponse = {
        year: '2026',
        locationTypes: ['01', '02'],
        quotaTypes: ['01', '02'],
      };
      repository.getYearConfigs.mockResolvedValue(mockResponse);

      // Act
      const result = await useCase.execute(year);

      // Assert
      expect(repository.getYearConfigs).toHaveBeenCalledWith(year);
      expect(result).toEqual(mockResponse);
      expect(result.locationTypes).toHaveLength(2);
      expect(result.quotaTypes).toHaveLength(2);
    });

    it('should return empty arrays when no configs found for year', async () => {
      // Arrange
      const year = '2027';
      const mockResponse: YearConfigsResponse = {
        year: '2027',
        locationTypes: [],
        quotaTypes: [],
      };
      repository.getYearConfigs.mockResolvedValue(mockResponse);

      // Act
      const result = await useCase.execute(year);

      // Assert
      expect(repository.getYearConfigs).toHaveBeenCalledWith(year);
      expect(result).toEqual(mockResponse);
      expect(result.locationTypes).toHaveLength(0);
      expect(result.quotaTypes).toHaveLength(0);
    });

    it('should throw INVALID_YEAR_FORMAT error when year format is invalid (not 4 digits)', async () => {
      // Arrange
      const year = '26';

      // Act & Assert
      await expect(useCase.execute(year)).rejects.toMatchObject({
        code: 'INVALID_YEAR_FORMAT',
        message: 'Invalid quota year format',
      });
      expect(repository.getYearConfigs).not.toHaveBeenCalled();
    });

    it('should throw INVALID_YEAR_FORMAT error when year contains non-digits', async () => {
      // Arrange
      const year = 'abcd';

      // Act & Assert
      await expect(useCase.execute(year)).rejects.toMatchObject({
        code: 'INVALID_YEAR_FORMAT',
        message: 'Invalid quota year format',
      });
      expect(repository.getYearConfigs).not.toHaveBeenCalled();
    });

    it('should throw INVALID_YEAR_FORMAT error when year has more than 4 digits', async () => {
      // Arrange
      const year = '20266';

      // Act & Assert
      await expect(useCase.execute(year)).rejects.toMatchObject({
        code: 'INVALID_YEAR_FORMAT',
        message: 'Invalid quota year format',
      });
      expect(repository.getYearConfigs).not.toHaveBeenCalled();
    });

    it('should throw DataAccessException when repository throws DataAccessException', async () => {
      // Arrange
      const year = '2026';
      const error = new DataAccessException(
        'Failed to get year configs: Database connection failed',
      );
      repository.getYearConfigs.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(year)).rejects.toThrow(DataAccessException);
      await expect(useCase.execute(year)).rejects.toMatchObject({
        code: 'DATA_ACCESS_ERROR',
        message: 'Failed to get year configs: Database connection failed',
      });
      expect(repository.getYearConfigs).toHaveBeenCalledWith(year);
    });

    it('should re-throw error if it already has a code', async () => {
      // Arrange
      const year = '2026';
      const error: any = new Error('Custom error');
      error.code = 'CUSTOM_ERROR';
      repository.getYearConfigs.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(year)).rejects.toMatchObject({
        code: 'CUSTOM_ERROR',
        message: 'Custom error',
      });
      expect(repository.getYearConfigs).toHaveBeenCalledWith(year);
    });
  });
});
