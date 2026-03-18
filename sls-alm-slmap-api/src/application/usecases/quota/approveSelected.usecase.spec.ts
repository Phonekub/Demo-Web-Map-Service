import { Test, TestingModule } from '@nestjs/testing';
import { ApproveSelectedUseCase, ApproveSelectedInput } from './approveSelected.usecase';
import { QuotaAllocationWorkflowService } from './helpers/quotaAllocationWorkflow.service';

describe('ApproveSelectedUseCase', () => {
  let useCase: ApproveSelectedUseCase;
  let workflowService: jest.Mocked<QuotaAllocationWorkflowService>;

  beforeEach(async () => {
    const mockWorkflowService = {
      processAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApproveSelectedUseCase,
        {
          provide: QuotaAllocationWorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    useCase = module.get<ApproveSelectedUseCase>(ApproveSelectedUseCase);
    workflowService = module.get(QuotaAllocationWorkflowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should throw BAD_REQUEST when ids array is empty', async () => {
      const input: ApproveSelectedInput = {
        ids: [],
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      };

      await expect(useCase.execute(input)).rejects.toEqual({
        code: 'BAD_REQUEST',
        message: 'Request body must be a non-empty array of IDs.',
      });
    });

    it('should throw UNAUTHORIZED when userId is missing', async () => {
      const input: ApproveSelectedInput = {
        ids: [1, 2, 3],
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
      const input: ApproveSelectedInput = {
        ids: [999],
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

    it('should return failure when user does not have access to zone', async () => {
      const input: ApproveSelectedInput = {
        ids: [1],
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      };

      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: false,
        message: 'Permission denied: you do not have access to this zone.',
      });

      const results = await useCase.execute(input);

      expect(results).toEqual([
        {
          id: 1,
          success: false,
          message: 'Permission denied: you do not have access to this zone.',
        },
      ]);
    });

    it('should successfully approve allocation', async () => {
      const input: ApproveSelectedInput = {
        ids: [1],
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
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
      });
    });

    it('should handle workflow approval failure', async () => {
      const input: ApproveSelectedInput = {
        ids: [1],
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      };

      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: false,
        message: 'Workflow error',
      });

      const results = await useCase.execute(input);

      expect(results[0].success).toBe(false);
      expect(results[0].message).toContain('Workflow error');
    });
  });

  describe('Multiple Allocations Processing', () => {
    it('should process multiple allocations with mixed results', async () => {
      const input: ApproveSelectedInput = {
        ids: [1, 2, 3],
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
          message: 'Permission denied: you do not have access to this zone.',
        });

      const results = await useCase.execute(input);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(false);
    });
  });
});
