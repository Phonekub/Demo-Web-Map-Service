import { Test, TestingModule } from '@nestjs/testing';
import { RejectSelectedUseCase, RejectSelectedInput } from './rejectSelected.usecase';
import { QuotaAllocationWorkflowService } from './helpers/quotaAllocationWorkflow.service';

describe('RejectSelectedUseCase', () => {
  let useCase: RejectSelectedUseCase;
  let workflowService: jest.Mocked<QuotaAllocationWorkflowService>;

  beforeEach(async () => {
    const mockWorkflowService = {
      processAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RejectSelectedUseCase,
        {
          provide: QuotaAllocationWorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    useCase = module.get<RejectSelectedUseCase>(RejectSelectedUseCase);
    workflowService = module.get(QuotaAllocationWorkflowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should throw BAD_REQUEST when ids array is empty', async () => {
      const input: RejectSelectedInput = {
        ids: [],
        reason: 'Test reason',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      };

      await expect(useCase.execute(input)).rejects.toEqual({
        code: 'BAD_REQUEST',
        message: 'Request body must contain a non-empty array of IDs.',
      });
    });

    it('should throw BAD_REQUEST when reason is missing', async () => {
      const input: RejectSelectedInput = {
        ids: [1, 2],
        reason: null as any,
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      };

      await expect(useCase.execute(input)).rejects.toEqual({
        code: 'BAD_REQUEST',
        message: 'Reason is required and must be a non-empty string.',
      });
    });

    it('should throw UNAUTHORIZED when userId is missing', async () => {
      const input: RejectSelectedInput = {
        ids: [1, 2],
        reason: 'Test reason',
        userId: null as any,
        userZones: ['BKK'],
        roleId: 5,
      };

      await expect(useCase.execute(input)).rejects.toEqual({
        code: 'UNAUTHORIZED',
        message: 'User authentication required.',
      });
    });
  });

  describe('Single Allocation Processing', () => {
    it('should return failure when allocation not found', async () => {
      const input: RejectSelectedInput = {
        ids: [999],
        reason: 'Not good enough',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      };

      workflowService.processAction.mockResolvedValue({
        allocationId: 999,
        success: false,
        message: 'Not found: allocation id does not exist or was deleted.',
      });

      const results = await useCase.execute(input);

      expect(results).toEqual([
        {
          id: 999,
          success: false,
          message: 'Not found: allocation id does not exist or was deleted.',
        },
      ]);
    });

    it('should return failure when allocation is already completed', async () => {
      const input: RejectSelectedInput = {
        ids: [1],
        reason: 'Already done',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      };

      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: false,
        message: 'Already completed: cannot reject a completed allocation.',
      });

      const results = await useCase.execute(input);

      expect(results).toEqual([
        {
          id: 1,
          success: false,
          message: 'Already completed: cannot reject a completed allocation.',
        },
      ]);
    });

    it('should successfully reject allocation with REJECT action', async () => {
      const input: RejectSelectedInput = {
        ids: [1],
        reason: 'Data is incorrect',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      };

      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: true,
      });

      const results = await useCase.execute(input);

      expect(results).toEqual([
        {
          id: 1,
          success: true,
        },
      ]);
      expect(workflowService.processAction).toHaveBeenCalledWith({
        allocationId: 1,
        actionCode: 'REJECT',
        userId: 1,
        userZones: ['BKK'],
        remark: 'Data is incorrect',
      });
    });
  });

  describe('Multiple Allocations Processing', () => {
    it('should process multiple allocations with mixed results', async () => {
      const input: RejectSelectedInput = {
        ids: [1, 2, 3, 4],
        reason: 'Needs revision',
        userId: 1,
        userZones: ['BKK', 'CNX'],
        roleId: 5,
      };

      workflowService.processAction
        .mockResolvedValueOnce({
          allocationId: 1,
          success: true,
        })
        .mockResolvedValueOnce({
          allocationId: 2,
          success: false,
          message: 'Not found: allocation id does not exist or was deleted.',
        })
        .mockResolvedValueOnce({
          allocationId: 3,
          success: false,
          message: 'Already completed: cannot reject a completed allocation.',
        })
        .mockResolvedValueOnce({
          allocationId: 4,
          success: false,
          message: 'Permission denied: you do not have access to this zone.',
        });

      const results = await useCase.execute(input);

      expect(results).toHaveLength(4);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(false);
      expect(results[3].success).toBe(false);
    });
  });

  describe('Workflow Integration', () => {
    it('should use REJECT action code for rejection', async () => {
      const input: RejectSelectedInput = {
        ids: [1],
        reason: 'Please review this',
        userId: 42,
        userZones: ['BKK'],
        roleId: 10,
      };

      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: true,
      });

      await useCase.execute(input);

      expect(workflowService.processAction).toHaveBeenCalledWith({
        allocationId: 1,
        actionCode: 'REJECT',
        userId: 42,
        userZones: ['BKK'],
        remark: 'Please review this',
      });
    });
  });
});
