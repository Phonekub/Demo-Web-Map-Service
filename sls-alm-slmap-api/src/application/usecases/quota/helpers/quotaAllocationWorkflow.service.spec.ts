import { Test, TestingModule } from '@nestjs/testing';
import {
  QuotaAllocationWorkflowService,
  ProcessAllocationInput,
} from './quotaAllocationWorkflow.service';
import { QuotaAllocationRepositoryPort } from '../../../ports/quotaAllocation.repository';
import { GetCurrentWorkflowStepUseCase } from '../../workflow/getCurrentWorkflowStep.usecase';
import { WorkflowApprovalUseCase } from '../../workflow/workflowApproval.usecase';
import { WorkflowSendMailUseCase } from '../../workflow/workflowSendMail.usecase';
import { MasterRepositoryPort } from '../../../ports/master.repository';

describe('QuotaAllocationWorkflowService', () => {
  let service: QuotaAllocationWorkflowService;
  let quotaAllocationRepository: jest.Mocked<QuotaAllocationRepositoryPort>;
  let getCurrentWorkflowStepUseCase: jest.Mocked<GetCurrentWorkflowStepUseCase>;
  let workflowApprovalUseCase: jest.Mocked<WorkflowApprovalUseCase>;
  let workflowSendMailUseCase: jest.Mocked<WorkflowSendMailUseCase>;

  beforeEach(async () => {
    const mockQuotaAllocationRepository = {
      findByIdWithZoneAndWorkflowStatus: jest.fn(),
      getQuotaRoundIdByAllocationId: jest.fn(),
      getQuotaAllocationsForRoundStatusCheck: jest.fn(),
      updateQuotaRoundStatus: jest.fn(),
    };

    const mockGetCurrentWorkflowStepUseCase = {
      handler: jest.fn(),
    };

    const mockWorkflowApprovalUseCase = {
      handler: jest.fn(),
    };

    const mockWorkflowSendMailUseCase = {
      handler: jest.fn(),
    };

    const mockMasterRepository: jest.Mocked<MasterRepositoryPort> = {
      getCommonCode: jest.fn(),
      getProvinces: jest.fn(),
      getDistricts: jest.fn(),
      getExportConfigs: jest.fn(),
      getReportFields: jest.fn(),
      getReportConfig: jest.fn(),
      executeDynamicQuery: jest.fn(),
      getSubDistricts: jest.fn(),
      getOneProvince: jest.fn(),
      getOneDistrict: jest.fn(),
      getZones: jest.fn(),
      getImportConfig: jest.fn(),
      getImportConfigById: jest.fn(),
      getImportFields: jest.fn(),
      getCommonCodeName: jest.fn(),
      getUrlByNation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaAllocationWorkflowService,
        {
          provide: 'QuotaAllocationRepository',
          useValue: mockQuotaAllocationRepository,
        },
        {
          provide: GetCurrentWorkflowStepUseCase,
          useValue: mockGetCurrentWorkflowStepUseCase,
        },
        {
          provide: WorkflowApprovalUseCase,
          useValue: mockWorkflowApprovalUseCase,
        },
        {
          provide: WorkflowSendMailUseCase,
          useValue: mockWorkflowSendMailUseCase,
        },
        {
          provide: 'MasterRepository',
          useValue: mockMasterRepository,
        },
      ],
    }).compile();

    service = module.get<QuotaAllocationWorkflowService>(QuotaAllocationWorkflowService);
    quotaAllocationRepository = module.get('QuotaAllocationRepository');
    getCurrentWorkflowStepUseCase = module.get(GetCurrentWorkflowStepUseCase);
    workflowApprovalUseCase = module.get(WorkflowApprovalUseCase);
    workflowSendMailUseCase = module.get(WorkflowSendMailUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processAction', () => {
    const mockInput: ProcessAllocationInput = {
      allocationId: 1,
      actionCode: 'APPROVE',
      userId: 10,
      userZones: ['BKK'],
    };

    it('should return failure when allocation not found', async () => {
      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(null);

      const result = await service.processAction(mockInput);

      expect(result).toEqual({
        allocationId: 1,
        success: false,
        message: 'Allocation ID 1 not found.',
      });
    });

    it('should return failure when user does not have access to zone', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'CNX',
        isCompleted: false,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '01',
        endMonth: '12',
        dueDate: new Date('2024-12-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );

      const result = await service.processAction(mockInput);

      expect(result).toEqual({
        allocationId: 1,
        success: false,
        message: 'Permission denied: You do not have access to zone CNX.',
      });
    });

    it('should return failure when allocation is already completed', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: true,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '01',
        endMonth: '12',
        dueDate: new Date('2024-12-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue({
        success: false,
        error: { message: 'Allocation is already completed' },
      } as any);

      const result = await service.processAction(mockInput);

      expect(result).toEqual({
        allocationId: 1,
        success: false,
        message: 'Workflow not found or not accessible.',
      });
    });

    it('should return failure when workflow step retrieval fails', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '01',
        endMonth: '12',
        dueDate: new Date('2024-12-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue({
        success: false,
        error: { message: 'Workflow step not found' },
      } as any);

      const result = await service.processAction(mockInput);

      expect(result).toEqual({
        allocationId: 1,
        success: false,
        message: 'Workflow not found or not accessible.',
      });
    });

    it('should return failure when action is not available', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '01',
        endMonth: '12',
        dueDate: new Date('2024-12-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue({
        success: true,
        data: {
          wfTransactionId: 100,
          availableActions: [{ actionCode: 'REJECT' }, { actionCode: 'SEND_BACK' }],
        } as any,
      } as any);

      const result = await service.processAction(mockInput);

      expect(result).toEqual({
        allocationId: 1,
        success: false,
        message: "Action 'APPROVE' is not available for this workflow step.",
      });
    });

    it('should return failure when workflow approval fails', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '01',
        endMonth: '12',
        dueDate: new Date('2024-12-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue({
        success: true,
        data: {
          wfTransactionId: 100,
          availableActions: [{ actionCode: 'APPROVE' }],
        } as any,
      } as any);
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: false,
        error: { message: 'Database error' },
      } as any);

      const result = await service.processAction(mockInput);

      expect(result).toEqual({
        allocationId: 1,
        success: false,
        message: 'Database error',
      });
    });

    it('should successfully process action and send email', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '01',
        endMonth: '12',
        dueDate: new Date('2024-12-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue({
        success: true,
        data: {
          wfTransactionId: 100,
          availableActions: [{ actionCode: 'APPROVE' }],
        } as any,
      } as any);
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: {
          wfEmailDetailId: 1,
        },
      } as any);
      workflowSendMailUseCase.handler.mockResolvedValue({
        success: true,
      } as any);

      const result = await service.processAction(mockInput);

      expect(result).toEqual({
        allocationId: 1,
        success: true,
      });
      expect(workflowApprovalUseCase.handler).toHaveBeenCalledWith({
        refId: 1,
        wfTransactionId: 100,
        approvalAction: 'APPROVE',
        userId: 10,
        wfParameter: {
          QUOTA_LOCATION_TYPE: 'Store',
        },
      });
      expect(workflowSendMailUseCase.handler).toHaveBeenCalled();
    });

    it('should successfully process action with remark', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '01',
        endMonth: '12',
        dueDate: new Date('2024-12-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue({
        success: true,
        data: {
          wfTransactionId: 100,
          availableActions: [{ actionCode: 'REJECT' }],
        } as any,
      } as any);
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: {
          wfEmailDetailId: 1,
        },
      } as any);
      workflowSendMailUseCase.handler.mockResolvedValue({
        success: true,
      } as any);

      const result = await service.processAction({
        ...mockInput,
        actionCode: 'REJECT',
        remark: 'Data needs revision',
      });

      expect(result).toEqual({
        allocationId: 1,
        success: true,
      });
      expect(workflowApprovalUseCase.handler).toHaveBeenCalledWith({
        refId: 1,
        wfTransactionId: 100,
        approvalAction: 'REJECT',
        userId: 10,
        remark: 'Data needs revision',
        wfParameter: {
          QUOTA_LOCATION_TYPE: 'Store',
        },
      });
    });

    it('should continue successfully even if email sending fails', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '01',
        endMonth: '12',
        dueDate: new Date('2024-12-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue({
        success: true,
        data: {
          wfTransactionId: 100,
          availableActions: [{ actionCode: 'APPROVE' }],
        } as any,
      } as any);
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: {
          wfEmailDetailId: 1,
        },
      } as any);
      workflowSendMailUseCase.handler.mockRejectedValue(new Error('SMTP error'));

      const result = await service.processAction(mockInput);

      // Should still return success even if email fails
      expect(result).toEqual({
        allocationId: 1,
        success: true,
      });
    });

    it('should build correct email template data with Thai month names', async () => {
      const mockAllocation = {
        id: 1,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round 1',
        startMonth: '02',
        endMonth: '11',
        dueDate: new Date('2024-11-30'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue({
        success: true,
        data: {
          wfTransactionId: 100,
          availableActions: [{ actionCode: 'APPROVE' }],
        } as any,
      } as any);
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: {
          wfEmailDetailId: 1,
        },
      } as any);
      workflowSendMailUseCase.handler.mockResolvedValue({
        success: true,
      } as any);

      await service.processAction(mockInput);

      expect(workflowSendMailUseCase.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          templateData: expect.objectContaining({
            YEAR: '2024',
            ROUND: 'Round 1',
            ZONE: 'BKK',
            START_MONTH: 'กุมภาพันธ์',
            END_MONTH: 'พฤศจิกายน',
            DUE_DATE: '30/11/2024',
            WEB_LINK: '',
          }),
        }),
      );
    });

    it('should evaluate and update quota_round when wfComplete != W and all allocations meet criteria', async () => {
      const mockAllocation = {
        id: 200,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round X',
        startMonth: '01',
        endMonth: '03',
        dueDate: new Date('2024-03-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );

      // First call returns wfTransactionId and availableActions, second call returns wfStatus with wfComplete != 'W'
      getCurrentWorkflowStepUseCase.handler
        .mockResolvedValueOnce({
          success: true,
          data: { wfTransactionId: 500, availableActions: [{ actionCode: 'APPROVE' }] },
        } as any)
        .mockResolvedValueOnce({
          success: true,
          data: { wfStatus: { wfComplete: 'Y' } },
        } as any);

      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: { wfEmailDetailId: 2 },
      } as any);
      workflowSendMailUseCase.handler.mockResolvedValue({ success: true } as any);

      // quota round id and allocations for check
      quotaAllocationRepository.getQuotaRoundIdByAllocationId.mockResolvedValue(77);
      quotaAllocationRepository.getQuotaAllocationsForRoundStatusCheck.mockResolvedValue([
        { id: 1, wfTransactionId: 10, wfComplete: 'Y', quotaAssign: 0, annualTarget: 0 },
        {
          id: 2,
          wfTransactionId: null,
          wfComplete: null,
          quotaAssign: 0,
          annualTarget: 0,
        },
      ] as any);

      const result = await service.processAction({
        allocationId: 200,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
      });

      expect(result.success).toBe(true);
      expect(
        quotaAllocationRepository.getQuotaRoundIdByAllocationId,
      ).toHaveBeenCalledWith(200);
      expect(
        quotaAllocationRepository.getQuotaAllocationsForRoundStatusCheck,
      ).toHaveBeenCalledWith(77);
      expect(quotaAllocationRepository.updateQuotaRoundStatus).toHaveBeenCalledWith(
        77,
        3,
      );
    });

    it('should NOT update quota_round when not all allocations meet criteria', async () => {
      const mockAllocation = {
        id: 201,
        zone: 'BKK',
        isCompleted: false,
        year: 2024,
        roundName: 'Round Y',
        startMonth: '01',
        endMonth: '03',
        dueDate: new Date('2024-03-31'),
        locationType: 'Store',
      };

      quotaAllocationRepository.findByIdWithZoneAndWorkflowStatus.mockResolvedValue(
        mockAllocation as any,
      );

      getCurrentWorkflowStepUseCase.handler
        .mockResolvedValueOnce({
          success: true,
          data: { wfTransactionId: 501, availableActions: [{ actionCode: 'APPROVE' }] },
        } as any)
        .mockResolvedValueOnce({
          success: true,
          data: { wfStatus: { wfComplete: 'Y' } },
        } as any);

      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: { wfEmailDetailId: 2 },
      } as any);
      workflowSendMailUseCase.handler.mockResolvedValue({ success: true } as any);

      quotaAllocationRepository.getQuotaRoundIdByAllocationId.mockResolvedValue(88);
      quotaAllocationRepository.getQuotaAllocationsForRoundStatusCheck.mockResolvedValue([
        // one allocation should NOT meet closing criteria (annualTarget != 0 and no wf transaction)
        { id: 1, wfTransactionId: 10, wfComplete: 'Y', quotaAssign: 0, annualTarget: 0 },
        {
          id: 2,
          wfTransactionId: null,
          wfComplete: null,
          quotaAssign: 0,
          annualTarget: 5,
        },
      ] as any);

      const result = await service.processAction({
        allocationId: 201,
        actionCode: 'APPROVE',
        userId: 1,
        userZones: ['BKK'],
      });

      expect(result.success).toBe(true);
      expect(quotaAllocationRepository.updateQuotaRoundStatus).not.toHaveBeenCalled();
    });
  });
});
