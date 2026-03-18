import { Test, TestingModule } from '@nestjs/testing';
import { ProcessAllocationActionUseCase } from './processAllocationAction.usecase';
import { QuotaAllocationWorkflowService } from './helpers/quotaAllocationWorkflow.service';

describe('ProcessAllocationActionUseCase', () => {
  let useCase: ProcessAllocationActionUseCase;
  let workflowService: jest.Mocked<QuotaAllocationWorkflowService>;

  beforeEach(async () => {
    const mockWorkflowService = {
      processAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessAllocationActionUseCase,
        {
          provide: QuotaAllocationWorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    useCase = module.get<ProcessAllocationActionUseCase>(ProcessAllocationActionUseCase);
    workflowService = module.get(QuotaAllocationWorkflowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should throw BAD_REQUEST when refId is missing', async () => {
      await expect(
        useCase.execute({
          refId: null as any,
          actionCode: 'APPROVE',
          userId: 1,
          userZones: ['BKK'],
          roleId: 5,
        }),
      ).rejects.toEqual({
        code: 'BAD_REQUEST',
        message: 'refId must be a valid number.',
      });
    });

    it('should throw BAD_REQUEST when actionCode is missing', async () => {
      await expect(
        useCase.execute({
          refId: 1,
          actionCode: null as any,
          userId: 1,
          userZones: ['BKK'],
          roleId: 5,
        }),
      ).rejects.toEqual({
        code: 'BAD_REQUEST',
        message: 'actionCode is required.',
      });
    });

    it('should throw BAD_REQUEST when actionCode is empty string', async () => {
      await expect(
        useCase.execute({
          refId: 1,
          actionCode: '  ',
          userId: 1,
          userZones: ['BKK'],
          roleId: 5,
        }),
      ).rejects.toEqual({
        code: 'BAD_REQUEST',
        message: 'actionCode is required.',
      });
    });

    it('should throw UNAUTHORIZED when userId is missing', async () => {
      await expect(
        useCase.execute({
          refId: 1,
          actionCode: 'APPROVE',
          userId: null as any,
          userZones: ['BKK'],
          roleId: 5,
        }),
      ).rejects.toEqual({
        code: 'UNAUTHORIZED',
        message: 'User authentication required.',
      });
    });
  });

  describe('Process Single Action', () => {
    it('should successfully process APPROVE action', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: true,
      });

      const result = await useCase.execute({
        refId: 1,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      });

      expect(result).toEqual({
        success: true,
        message: "Action 'APPROVE' processed successfully.",
        data: {
          refId: 1,
          actionCode: 'APPROVE',
        },
      });
      expect(workflowService.processAction).toHaveBeenCalledWith({
        allocationId: 1,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
        remark: undefined,
      });
    });

    it('should successfully process REJECT action with remark', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: true,
      });

      const result = await useCase.execute({
        refId: 1,
        actionCode: 'REJECT',
        remark: 'Data is incorrect',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      });

      expect(result).toEqual({
        success: true,
        message: "Action 'REJECT' processed successfully.",
        data: {
          refId: 1,
          actionCode: 'REJECT',
        },
      });
      expect(workflowService.processAction).toHaveBeenCalledWith({
        allocationId: 1,
        actionCode: 'REJECT',
        userId: 1,
        userZones: ['BKK'],
        remark: 'Data is incorrect',
      });
    });

    it('should handle custom action codes', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: true,
      });

      const result = await useCase.execute({
        refId: 1,
        actionCode: 'SEND_APPROVE',
        userId: 1,
        userZones: ['BKK', 'CNX'],
        roleId: 5,
      });

      expect(result).toEqual({
        success: true,
        message: "Action 'SEND_APPROVE' processed successfully.",
        data: {
          refId: 1,
          actionCode: 'SEND_APPROVE',
        },
      });
      expect(workflowService.processAction).toHaveBeenCalledWith({
        allocationId: 1,
        actionCode: 'SEND_APPROVE',
        userId: 1,
        userZones: ['BKK', 'CNX'],
        remark: undefined,
      });
    });

    it('should return failure when allocation not found', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 999,
        success: false,
        message: 'Not found: allocation id does not exist or was deleted.',
      });

      const result = await useCase.execute({
        refId: 999,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      });

      expect(result).toEqual({
        success: false,
        message: 'Not found: allocation id does not exist or was deleted.',
      });
    });

    it('should return failure when user has no access to zone', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: false,
        message: 'Permission denied: you do not have access to this zone.',
      });

      const result = await useCase.execute({
        refId: 1,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['CNX'],
        roleId: 5,
      });

      expect(result).toEqual({
        success: false,
        message: 'Permission denied: you do not have access to this zone.',
      });
    });

    it('should return failure when action is not available', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: false,
        message:
          'Action not available: CUSTOM_ACTION is not allowed at this workflow step.',
      });

      const result = await useCase.execute({
        refId: 1,
        actionCode: 'CUSTOM_ACTION',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      });

      expect(result).toEqual({
        success: false,
        message:
          'Action not available: CUSTOM_ACTION is not allowed at this workflow step.',
      });
    });

    it('should handle workflow approval failure', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: false,
        message: 'Workflow approval failed.',
      });

      const result = await useCase.execute({
        refId: 1,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      });

      expect(result).toEqual({
        success: false,
        message: 'Workflow approval failed.',
      });
    });
  });

  describe('Optional Remark', () => {
    it('should handle optional remark when not provided', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: true,
      });

      await useCase.execute({
        refId: 1,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      });

      expect(workflowService.processAction).toHaveBeenCalledWith({
        allocationId: 1,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
        remark: undefined,
      });
    });

    it('should pass remark when provided', async () => {
      workflowService.processAction.mockResolvedValue({
        allocationId: 1,
        success: true,
      });

      await useCase.execute({
        refId: 1,
        actionCode: 'REJECT',
        remark: 'Please revise the data',
        userId: 1,
        userZones: ['BKK'],
        roleId: 5,
      });

      expect(workflowService.processAction).toHaveBeenCalledWith({
        allocationId: 1,
        actionCode: 'REJECT',
        userId: 1,
        userZones: ['BKK'],
        remark: 'Please revise the data',
      });
    });
  });
});
