import { Test, TestingModule } from '@nestjs/testing';
import { GetQuotaRoundsUseCase } from './getQuotaRounds.usecase';
import { QuotaConfigRepositoryPort } from '../../ports/quotaConfig.repository';

describe('GetQuotaRoundsUseCase', () => {
  let useCase: GetQuotaRoundsUseCase;
  let repository: jest.Mocked<QuotaConfigRepositoryPort>;

  beforeEach(async () => {
    const mockRepository = {
      findDistinctRoundsByYear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetQuotaRoundsUseCase,
        {
          provide: 'QuotaConfigRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetQuotaRoundsUseCase>(GetQuotaRoundsUseCase);
    repository = module.get('QuotaConfigRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return formatted dropdown options for rounds', async () => {
      const year = 2026;
      const mockRounds = [
        { roundName: 'รอบ 1 asdf' },
        { roundName: 'รอบ 2 asdf' },
        { roundName: 'รอบ 3 asdf' },
      ];

      repository.findDistinctRoundsByYear.mockResolvedValue(mockRounds);

      const result = await useCase.execute(year);

      expect(result).toEqual([
        { value: 'รอบ 1 asdf', text: 'รอบ 1 asdf' },
        { value: 'รอบ 2 asdf', text: 'รอบ 2 asdf' },
        { value: 'รอบ 3 asdf', text: 'รอบ 3 asdf' },
      ]);
      expect(repository.findDistinctRoundsByYear).toHaveBeenCalledWith(year);
    });

    it('should return empty array when no rounds found', async () => {
      const year = 2026;
      repository.findDistinctRoundsByYear.mockResolvedValue([]);

      const result = await useCase.execute(year);

      expect(result).toEqual([]);
      expect(repository.findDistinctRoundsByYear).toHaveBeenCalledWith(year);
    });

    it('should handle single round', async () => {
      const year = 2026;
      const mockRounds = [{ roundName: 'รอบ 1 asdf' }];

      repository.findDistinctRoundsByYear.mockResolvedValue(mockRounds);

      const result = await useCase.execute(year);

      expect(result).toEqual([{ value: 'รอบ 1 asdf', text: 'รอบ 1 asdf' }]);
    });

    it('should handle multiple rounds with different formats', async () => {
      const year = 2026;
      const mockRounds = [
        { roundName: 'Q1' },
        { roundName: 'Q2' },
        { roundName: 'Q3' },
        { roundName: 'Q4' },
      ];

      repository.findDistinctRoundsByYear.mockResolvedValue(mockRounds);

      const result = await useCase.execute(year);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ value: 'Q1', text: 'Q1' });
      expect(result[3]).toEqual({ value: 'Q4', text: 'Q4' });
    });

    it('should call repository with correct year parameter', async () => {
      const year = 2025;
      repository.findDistinctRoundsByYear.mockResolvedValue([]);

      await useCase.execute(year);

      expect(repository.findDistinctRoundsByYear).toHaveBeenCalledTimes(1);
      expect(repository.findDistinctRoundsByYear).toHaveBeenCalledWith(2025);
    });

    it('should handle year 2027', async () => {
      const year = 2027;
      const mockRounds = [{ roundName: 'รอบ 1' }, { roundName: 'รอบ 2' }];

      repository.findDistinctRoundsByYear.mockResolvedValue(mockRounds);

      const result = await useCase.execute(year);

      expect(result).toHaveLength(2);
      expect(repository.findDistinctRoundsByYear).toHaveBeenCalledWith(2027);
    });

    it('should propagate repository errors', async () => {
      const year = 2026;
      const error = new Error('Database connection failed');

      repository.findDistinctRoundsByYear.mockRejectedValue(error);

      await expect(useCase.execute(year)).rejects.toThrow('Database connection failed');
    });

    it('should handle rounds with special characters', async () => {
      const year = 2026;
      const mockRounds = [{ roundName: 'รอบ 1/2026' }, { roundName: 'รอบ 2/2026' }];

      repository.findDistinctRoundsByYear.mockResolvedValue(mockRounds);

      const result = await useCase.execute(year);

      expect(result).toEqual([
        { value: 'รอบ 1/2026', text: 'รอบ 1/2026' },
        { value: 'รอบ 2/2026', text: 'รอบ 2/2026' },
      ]);
    });

    it('should handle rounds with long names', async () => {
      const year = 2026;
      const longRoundName = 'รอบที่ 1 ประจำปี 2026 ไตรมาสที่ 1';
      const mockRounds = [{ roundName: longRoundName }];

      repository.findDistinctRoundsByYear.mockResolvedValue(mockRounds);

      const result = await useCase.execute(year);

      expect(result).toEqual([{ value: longRoundName, text: longRoundName }]);
    });

    it('should preserve order of rounds from repository', async () => {
      const year = 2026;
      const mockRounds = [
        { roundName: 'รอบ 3 asdf' },
        { roundName: 'รอบ 1 asdf' },
        { roundName: 'รอบ 2 asdf' },
      ];

      repository.findDistinctRoundsByYear.mockResolvedValue(mockRounds);

      const result = await useCase.execute(year);

      expect(result[0].value).toBe('รอบ 3 asdf');
      expect(result[1].value).toBe('รอบ 1 asdf');
      expect(result[2].value).toBe('รอบ 2 asdf');
    });
  });
});
