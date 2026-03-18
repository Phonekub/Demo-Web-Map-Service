import { Test, TestingModule } from '@nestjs/testing';
import { SearchQuotaAllocationUseCase } from './searchQuotaAllocation.usecase';
import { QuotaAllocationSearchRepositoryPort } from '../../ports/quotaAllocationSearch.repository';
import { QuotaSearchQuery, QuotaSearch } from '../../../domain/quotaSearch';
import { QuotaException } from '../../../common/exceptions/quota.exception';

describe('SearchQuotaAllocationUseCase', () => {
  let useCase: SearchQuotaAllocationUseCase;
  let repository: jest.Mocked<QuotaAllocationSearchRepositoryPort>;

  beforeEach(async () => {
    const mockRepository = {
      searchQuotas: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchQuotaAllocationUseCase,
        {
          provide: 'QuotaAllocationSearchRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<SearchQuotaAllocationUseCase>(SearchQuotaAllocationUseCase);
    repository = module.get('QuotaAllocationSearchRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should return quota allocations successfully', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        pendingOnly: false,
      };

      const mockQuotas: QuotaSearch[] = [
        {
          id: 1,
          year: '2026',
          zone: 'BKK',
          locationTypeName: 'C Store',
          quotaTypeName: 'Standard Quota',
          round: 'Round 1',
          keyed: 5,
          quota: 10,
          statusName: 'Pending',
        },
        {
          id: 2,
          year: '2026',
          zone: 'CNX',
          locationTypeName: 'C Store',
          quotaTypeName: 'Standard Quota',
          round: 'Round 1',
          keyed: 3,
          quota: 8,
          statusName: 'Approved',
        },
      ];

      repository.searchQuotas.mockResolvedValue([mockQuotas]);

      const result = await useCase.search(mockQuery, ['BKK', 'CNX']);

      expect(result).toEqual({
        data: mockQuotas,
      });
      expect(repository.searchQuotas).toHaveBeenCalledWith(
        mockQuery,
        ['BKK', 'CNX'],
        undefined,
        undefined,
      );
    });

    it('should pass userId and roleId to repository', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        pendingOnly: true,
      };

      repository.searchQuotas.mockResolvedValue([[]]);

      await useCase.search(mockQuery, ['BKK'], 42, 5);

      expect(repository.searchQuotas).toHaveBeenCalledWith(mockQuery, ['BKK'], 42, 5);
    });

    it('should filter by pendingOnly when true', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        pendingOnly: true,
      };

      const mockPendingQuotas: QuotaSearch[] = [
        {
          id: 1,
          year: '2026',
          zone: 'BKK',
          locationTypeName: 'C Store',
          quotaTypeName: 'Standard',
          round: 'Round 1',
          keyed: 1,
          quota: 10,
          statusName: 'Pending',
        },
      ];

      repository.searchQuotas.mockResolvedValue([mockPendingQuotas]);

      const result = await useCase.search(mockQuery, ['BKK']);

      expect(result.data).toEqual(mockPendingQuotas);
    });

    it('should search with multiple filter criteria', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        locationType: 'C_STORE',
        quotaType: '01',
        round: 'ROUND_1',
        zone: 'BKK',
        status: 'PENDING',
        pendingOnly: false,
      };

      const mockQuotas: QuotaSearch[] = [
        {
          id: 1,
          year: '2026',
          zone: 'BKK',
          locationTypeName: 'C Store',
          quotaTypeName: 'Standard',
          round: 'Round 1',
          keyed: 5,
          quota: 10,
          statusName: 'Pending',
        },
      ];

      repository.searchQuotas.mockResolvedValue([mockQuotas]);

      const result = await useCase.search(mockQuery, ['BKK']);

      expect(result.data).toEqual(mockQuotas);
    });

    it('should return empty array when no quotas found', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        pendingOnly: false,
      };

      repository.searchQuotas.mockResolvedValue([[]]);

      const result = await useCase.search(mockQuery, ['BKK']);

      expect(result).toEqual({
        data: [],
      });
    });

    it('should handle user with multiple zones', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        pendingOnly: false,
      };

      const mockQuotas: QuotaSearch[] = [
        {
          id: 1,
          year: '2026',
          zone: 'BKK',
          locationTypeName: 'C Store',
          quotaTypeName: 'Standard',
          round: 'Round 1',
          keyed: 5,
          quota: 10,
          statusName: 'Pending',
        },
        {
          id: 2,
          year: '2026',
          zone: 'CNX',
          locationTypeName: 'C Store',
          quotaTypeName: 'Standard',
          round: 'Round 1',
          keyed: 3,
          quota: 8,
          statusName: 'Approved',
        },
      ];

      repository.searchQuotas.mockResolvedValue([mockQuotas]);

      const result = await useCase.search(mockQuery, ['BKK', 'CNX', 'HDY']);

      expect(result.data).toHaveLength(2);
    });

    it('should throw QuotaException when repository throws QuotaException', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        pendingOnly: false,
      };

      const quotaException = new QuotaException('INVALID_YEAR', 'Invalid year format');

      repository.searchQuotas.mockRejectedValue(quotaException);

      await expect(useCase.search(mockQuery, ['BKK'])).rejects.toThrow(QuotaException);
    });

    it('should wrap generic errors in QuotaException', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        pendingOnly: false,
      };

      repository.searchQuotas.mockRejectedValue(new Error('Database connection failed'));

      await expect(useCase.search(mockQuery, ['BKK'])).rejects.toThrow(QuotaException);
    });

    it('should preserve all quota data fields in response', async () => {
      const mockQuery: QuotaSearchQuery = {
        year: '2026',
        pendingOnly: false,
      };

      const mockQuotas: QuotaSearch[] = [
        {
          id: 123,
          year: '2026',
          zone: 'BKK',
          locationTypeName: 'C Store',
          quotaTypeName: 'Standard Quota',
          round: 'ROUND_1',
          keyed: 15,
          quota: 20,
          statusName: 'Pending Approval',
        },
      ];

      repository.searchQuotas.mockResolvedValue([mockQuotas]);

      const result = await useCase.search(mockQuery, ['BKK']);

      expect(result.data[0]).toEqual(mockQuotas[0]);
      expect(result.data[0].keyed).toBe(15);
      expect(result.data[0].quota).toBe(20);
    });
  });
});
