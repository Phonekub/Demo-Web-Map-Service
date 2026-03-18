import { Test, TestingModule } from '@nestjs/testing';
import {
  GetAllocationHistoryUseCase,
  GetAllocationHistoryInput,
} from './getAllocationHistory.usecase';
import { GetWorkflowHistoryUseCase } from '../workflow/getWorkflowHistory.usecase';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import { QuotaException } from '../../../common/exceptions/quota.exception';

describe('GetAllocationHistoryUseCase', () => {
  let useCase: GetAllocationHistoryUseCase;
  let getWorkflowHistoryUseCase: jest.Mocked<GetWorkflowHistoryUseCase>;
  let quotaAllocationRepository: jest.Mocked<QuotaAllocationRepositoryPort>;

  beforeEach(async () => {
    const mockGetWorkflowHistoryUseCase = {
      handler: jest.fn(),
    };

    const mockQuotaAllocationRepository = {
      findByIdWithZoneAndWorkflowStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllocationHistoryUseCase,
        {
          provide: GetWorkflowHistoryUseCase,
          useValue: mockGetWorkflowHistoryUseCase,
        },
        {
          provide: 'QuotaAllocationRepository',
          useValue: mockQuotaAllocationRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetAllocationHistoryUseCase>(GetAllocationHistoryUseCase);
    getWorkflowHistoryUseCase = module.get(GetWorkflowHistoryUseCase);
    quotaAllocationRepository = module.get('QuotaAllocationRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should throw BAD_REQUEST when id is missing', async () => {
      const input: GetAllocationHistoryInput = {
        id: null as any,
        userId: 1,
        userZones: ['BKK'],
      };

      await expect(useCase.execute(input)).rejects.toThrow(QuotaException);
      await expect(useCase.execute(input)).rejects.toThrow('Invalid allocation ID');
    });

    it('should throw BAD_REQUEST when id is zero or negative', async () => {
      const input: GetAllocationHistoryInput = {
        id: 0,
        userId: 1,
        userZones: ['BKK'],
      };

      await expect(useCase.execute(input)).rejects.toThrow(QuotaException);
      await expect(useCase.execute(input)).rejects.toThrow('Invalid allocation ID');
    });

    it('should throw UNAUTHORIZED when userId is missing', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: null as any,
        userZones: ['BKK'],
      };

      await expect(useCase.execute(input)).rejects.toThrow(QuotaException);
      await expect(useCase.execute(input)).rejects.toThrow(
        'User authentication required',
      );
    });
  });

  describe('Permission Checks', () => {
    it('should throw NOT_FOUND when allocation does not exist', async () => {
      const input: GetAllocationHistoryInput = {
        id: 999,
        userId: 1,
        userZones: ['BKK'],
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(QuotaException);
      await expect(useCase.execute(input)).rejects.toThrow(
        'Allocation not found or has been deleted',
      );
    });

    it('should throw FORBIDDEN when user does not have zone access', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'CNX',
        isCompleted: false,
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );

      await expect(useCase.execute(input)).rejects.toThrow(QuotaException);
      await expect(useCase.execute(input)).rejects.toThrow(
        'You do not have permission to access this zone',
      );
    });

    it('should throw FORBIDDEN when userZones is empty', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: [],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );

      await expect(useCase.execute(input)).rejects.toThrow(QuotaException);
      await expect(useCase.execute(input)).rejects.toThrow(
        'You do not have permission to access this zone',
      );
    });
  });

  describe('Successful History Retrieval', () => {
    it('should return formatted history with correct sequence and sorting', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      const mockWorkflowHistory = {
        success: true,
        data: {
          histories: [
            {
              createDate: new Date('2026-01-15T10:30:00'),
              wfStatus: { wfStatusName: 'Pending' },
              wfAction: { wfActionName: 'Submit' },
              remark: 'Initial submission',
              createBy: { name: 'John Doe' },
            },
            {
              createDate: new Date('2026-01-20T14:45:00'),
              wfStatus: { wfStatusName: 'Approved' },
              wfAction: { wfActionName: 'Approve' },
              remark: 'Looks good',
              createBy: { name: 'Jane Smith' },
            },
            {
              createDate: new Date('2026-01-18T09:15:00'),
              wfStatus: { wfStatusName: 'In Review' },
              wfAction: { wfActionName: 'Review' },
              remark: null,
              createBy: { name: 'Bob Wilson' },
            },
          ],
        },
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockResolvedValue(mockWorkflowHistory as any);

      const result = await useCase.execute(input);

      expect(result.data).toHaveLength(3);
      // Should be sorted by date descending (latest first)
      expect(result.data[0].sequence).toBe(1);
      expect(result.data[0].statusName).toBe('Approved');
      expect(result.data[0].actionDate).toBe('2026-01-20 14:45:00');
      expect(result.data[1].sequence).toBe(2);
      expect(result.data[1].statusName).toBe('In Review');
      expect(result.data[2].sequence).toBe(3);
      expect(result.data[2].statusName).toBe('Pending');
    });

    it('should handle null remark in history', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      const mockWorkflowHistory = {
        success: true,
        data: {
          histories: [
            {
              createDate: new Date('2026-01-15T10:30:00'),
              wfStatus: { wfStatusName: 'Pending' },
              wfAction: { wfActionName: 'Submit' },
              remark: null,
              createBy: { name: 'John Doe' },
            },
          ],
        },
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockResolvedValue(mockWorkflowHistory as any);

      const result = await useCase.execute(input);

      expect(result.data[0].remark).toBeNull();
    });

    it('should return empty array when no history found', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      const mockWorkflowHistory = {
        success: true,
        data: {
          histories: [],
        },
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockResolvedValue(mockWorkflowHistory as any);

      const result = await useCase.execute(input);

      expect(result.data).toEqual([]);
    });

    it('should call workflow history with correct parameters', async () => {
      const input: GetAllocationHistoryInput = {
        id: 123,
        userId: 42,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 123,
        zone: 'BKK',
        isCompleted: false,
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockResolvedValue({
        success: true,
        data: { histories: [] },
      } as any);

      await useCase.execute(input);

      expect(getWorkflowHistoryUseCase.handler).toHaveBeenCalledWith(123, 5);
    });

    it('should allow access for user with multiple zones', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK', 'CNX', 'HDY'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'CNX',
        isCompleted: false,
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockResolvedValue({
        success: true,
        data: { histories: [] },
      } as any);

      const result = await useCase.execute(input);

      expect(result.data).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should throw QuotaException when workflow history fails', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockResolvedValue({
        success: false,
        error: {
          code: 'WORKFLOW_ERROR',
          message: 'Failed to get workflow history',
        },
      } as any);

      await expect(useCase.execute(input)).rejects.toThrow(QuotaException);
      await expect(useCase.execute(input)).rejects.toThrow(
        'Failed to get workflow history',
      );
    });

    it('should wrap generic errors in QuotaException', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(useCase.execute(input)).rejects.toThrow(QuotaException);
      await expect(useCase.execute(input)).rejects.toThrow(
        'An error occurred while accessing allocation history',
      );
    });

    it('should preserve QuotaException from workflow history', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      const quotaException = new QuotaException('CUSTOM_ERROR', 'Custom error message');

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockRejectedValue(quotaException);

      await expect(useCase.execute(input)).rejects.toThrow(quotaException);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      const mockWorkflowHistory = {
        success: true,
        data: {
          histories: [
            {
              createDate: new Date('2026-02-12T09:05:03'),
              wfStatus: { wfStatusName: 'Approved' },
              wfAction: { wfActionName: 'Approve' },
              remark: 'Test',
              createBy: { name: 'Test User' },
            },
          ],
        },
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockResolvedValue(mockWorkflowHistory as any);

      const result = await useCase.execute(input);

      expect(result.data[0].actionDate).toBe('2026-02-12 09:05:03');
    });

    it('should handle date strings', async () => {
      const input: GetAllocationHistoryInput = {
        id: 1,
        userId: 1,
        userZones: ['BKK'],
      };

      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
      };

      const mockWorkflowHistory = {
        success: true,
        data: {
          histories: [
            {
              createDate: '2026-12-25T23:59:59',
              wfStatus: { wfStatusName: 'Completed' },
              wfAction: { wfActionName: 'Complete' },
              remark: 'Done',
              createBy: { name: 'Admin' },
            },
          ],
        },
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getWorkflowHistoryUseCase.handler.mockResolvedValue(mockWorkflowHistory as any);

      const result = await useCase.execute(input);

      expect(result.data[0].actionDate).toBe('2026-12-25 23:59:59');
    });
  });
});
