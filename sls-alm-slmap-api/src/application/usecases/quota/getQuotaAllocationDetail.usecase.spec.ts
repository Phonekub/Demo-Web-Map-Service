import { Test, TestingModule } from '@nestjs/testing';
import { GetQuotaAllocationDetailUseCase } from './getQuotaAllocationDetail.usecase';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { QuotaAllocationDetailResponse } from '../../../domain/quotaAllocation';
import { Language } from '../../../common/enums/language.enum';
import { DataAccessException } from '../../../common/exceptions/quota.exception';

describe('GetQuotaAllocationDetailUseCase', () => {
  let useCase: GetQuotaAllocationDetailUseCase;
  let quotaAllocationRepository: jest.Mocked<QuotaAllocationRepositoryPort>;
  let masterRepository: jest.Mocked<MasterRepositoryPort>;

  beforeEach(async () => {
    const mockQuotaAllocationRepository = {
      getAllocationDetail: jest.fn(),
    };

    const mockMasterRepository = {
      getCommonCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetQuotaAllocationDetailUseCase,
        {
          provide: 'QuotaAllocationRepository',
          useValue: mockQuotaAllocationRepository,
        },
        {
          provide: 'MasterRepository',
          useValue: mockMasterRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetQuotaAllocationDetailUseCase>(
      GetQuotaAllocationDetailUseCase,
    );
    quotaAllocationRepository = module.get('QuotaAllocationRepository');
    masterRepository = module.get('MasterRepository');
  });

  describe('execute', () => {
    it('should return allocation detail with enriched common code names (English)', async () => {
      // Arrange
      const allocationId = 2;
      const language = Language.EN;

      const mockResponse: QuotaAllocationDetailResponse = {
        quota_allocation_id: 2,
        year: '2026',
        location_type: {
          value: '01',
          name: '',
        },
        quota_type: {
          value: '01',
          name: '',
        },
        zone: {
          id: 12,
          code: 'BN',
          name: 'BN',
        },
        round_allocations: [
          {
            quota_allocation_id: 1,
            quota_round: {
              id: 1,
              seq: 1,
              name: 'Round 1',
              start_month: '03',
              end_month: '05',
              due_date: '2026-04-15T00:00:00.000Z',
              is_review_mode: 'N',
            },
            assigned_quota: 30,
            reserved_quota: 5,
            assigned_items: [],
            reserved_items: [],
          },
        ],
      };

      const mockLocationTypes = [
        { value: '01', text: 'C Store' },
        { value: '02', text: 'Vending Machine' },
      ];

      const mockQuotaTypes = [
        { value: '01', text: 'Regular Opening' },
        { value: '02', text: 'Additional Opening' },
      ];

      quotaAllocationRepository.getAllocationDetail.mockResolvedValue(mockResponse);
      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      // Act
      const result = await useCase.execute(allocationId, language);

      // Assert
      expect(quotaAllocationRepository.getAllocationDetail).toHaveBeenCalledWith(
        allocationId,
      );
      expect(masterRepository.getCommonCode).toHaveBeenCalledWith(
        'QUOTA_LOCATION_TYPE',
        language,
      );
      expect(masterRepository.getCommonCode).toHaveBeenCalledWith('QUOTA_TYPE', language);
      expect(result.location_type.name).toBe('C Store');
      expect(result.quota_type.name).toBe('Regular Opening');
      expect(result.quota_allocation_id).toBe(2);
      expect(result.year).toBe('2026');
    });

    it('should return allocation detail with Thai language', async () => {
      // Arrange
      const allocationId = 1;
      const language = Language.TH;

      const mockResponse: QuotaAllocationDetailResponse = {
        quota_allocation_id: 1,
        year: '2026',
        location_type: {
          value: '01',
          name: '',
        },
        quota_type: {
          value: '01',
          name: '',
        },
        zone: {
          id: 12,
          code: 'BN',
          name: 'BN',
        },
        round_allocations: [],
      };

      const mockLocationTypes = [{ value: '01', text: 'ร้านสะดวกซื้อ' }];
      const mockQuotaTypes = [{ value: '01', text: 'เปิดปกติ' }];

      quotaAllocationRepository.getAllocationDetail.mockResolvedValue(mockResponse);
      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      // Act
      const result = await useCase.execute(allocationId, language);

      // Assert
      expect(result.location_type.name).toBe('ร้านสะดวกซื้อ');
      expect(result.quota_type.name).toBe('เปิดปกติ');
      expect(masterRepository.getCommonCode).toHaveBeenCalledWith(
        'QUOTA_LOCATION_TYPE',
        Language.TH,
      );
    });

    it('should use English as default language when not specified', async () => {
      // Arrange
      const allocationId = 1;

      const mockResponse: QuotaAllocationDetailResponse = {
        quota_allocation_id: 1,
        year: '2026',
        location_type: { value: '01', name: '' },
        quota_type: { value: '01', name: '' },
        zone: { id: 12, code: 'BN', name: 'BN' },
        round_allocations: [],
      };

      const mockLocationTypes = [{ value: '01', text: 'C Store' }];
      const mockQuotaTypes = [{ value: '01', text: 'Regular Opening' }];

      quotaAllocationRepository.getAllocationDetail.mockResolvedValue(mockResponse);
      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      // Act
      const result = await useCase.execute(allocationId);

      // Assert
      expect(masterRepository.getCommonCode).toHaveBeenCalledWith(
        'QUOTA_LOCATION_TYPE',
        Language.EN,
      );
      expect(masterRepository.getCommonCode).toHaveBeenCalledWith(
        'QUOTA_TYPE',
        Language.EN,
      );
    });

    it('should handle empty common code names gracefully', async () => {
      // Arrange
      const allocationId = 1;

      const mockResponse: QuotaAllocationDetailResponse = {
        quota_allocation_id: 1,
        year: '2026',
        location_type: { value: '99', name: '' },
        quota_type: { value: '99', name: '' },
        zone: { id: 12, code: 'BN', name: 'BN' },
        round_allocations: [],
      };

      const mockLocationTypes = [{ value: '01', text: 'C Store' }];
      const mockQuotaTypes = [{ value: '01', text: 'Regular Opening' }];

      quotaAllocationRepository.getAllocationDetail.mockResolvedValue(mockResponse);
      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      // Act
      const result = await useCase.execute(allocationId);

      // Assert
      expect(result.location_type.name).toBe('');
      expect(result.quota_type.name).toBe('');
    });

    it('should throw DataAccessException when repository fails', async () => {
      // Arrange
      const allocationId = 999;
      quotaAllocationRepository.getAllocationDetail.mockRejectedValue(
        new DataAccessException('Allocation not found'),
      );

      // Act & Assert
      await expect(useCase.execute(allocationId)).rejects.toThrow(DataAccessException);
      await expect(useCase.execute(allocationId)).rejects.toThrow('Allocation not found');
      expect(masterRepository.getCommonCode).not.toHaveBeenCalled();
    });

    it('should throw DataAccessException when master repository fails', async () => {
      // Arrange
      const allocationId = 1;

      const mockResponse: QuotaAllocationDetailResponse = {
        quota_allocation_id: 1,
        year: '2026',
        location_type: { value: '01', name: '' },
        quota_type: { value: '01', name: '' },
        zone: { id: 12, code: 'BN', name: 'BN' },
        round_allocations: [],
      };

      quotaAllocationRepository.getAllocationDetail.mockResolvedValue(mockResponse);
      masterRepository.getCommonCode.mockRejectedValue(
        new Error('Common code service unavailable'),
      );

      // Act & Assert
      await expect(useCase.execute(allocationId)).rejects.toThrow(DataAccessException);
    });

    it('should handle allocation with multiple rounds', async () => {
      // Arrange
      const allocationId = 2;

      const mockResponse: QuotaAllocationDetailResponse = {
        quota_allocation_id: 2,
        year: '2026',
        location_type: { value: '01', name: '' },
        quota_type: { value: '01', name: '' },
        zone: { id: 12, code: 'BN', name: 'BN' },
        round_allocations: [
          {
            quota_allocation_id: 1,
            quota_round: {
              id: 1,
              seq: 1,
              name: 'Round 1',
              start_month: '03',
              end_month: '05',
              due_date: '2026-04-15T00:00:00.000Z',
              is_review_mode: 'N',
            },
            assigned_quota: 30,
            reserved_quota: 5,
            assigned_items: [
              {
                id: 1,
                seq: 1,
                poi: {
                  id: 1,
                  form_no: '00001',
                  name: 'Store 1',
                  zone_code: 'BN',
                  sub_zone: 'BN1',
                },
                open_type: '01',
                open_month: '03',
                closed_store: null,
              },
            ],
            reserved_items: [],
          },
          {
            quota_allocation_id: 2,
            quota_round: {
              id: 2,
              seq: 2,
              name: 'Round 2',
              start_month: '06',
              end_month: '12',
              due_date: '2026-10-15T00:00:00.000Z',
              is_review_mode: 'N',
            },
            assigned_quota: 35,
            reserved_quota: 6,
            assigned_items: [],
            reserved_items: [],
          },
        ],
      };

      const mockLocationTypes = [{ value: '01', text: 'C Store' }];
      const mockQuotaTypes = [{ value: '01', text: 'Regular Opening' }];

      quotaAllocationRepository.getAllocationDetail.mockResolvedValue(mockResponse);
      masterRepository.getCommonCode
        .mockResolvedValueOnce(mockLocationTypes)
        .mockResolvedValueOnce(mockQuotaTypes);

      // Act
      const result = await useCase.execute(allocationId);

      // Assert
      expect(result.round_allocations).toHaveLength(2);
      expect(result.round_allocations[0].quota_round.seq).toBe(1);
      expect(result.round_allocations[1].quota_round.seq).toBe(2);
      expect(result.round_allocations[0].assigned_items).toHaveLength(1);
    });
  });
});
