import { SubmitQuotaRoundAllZonesUseCase } from './submitQuotaRoundAllZones.usecase';

describe('SubmitQuotaRoundAllZonesUseCase', () => {
  let usecase: SubmitQuotaRoundAllZonesUseCase;
  const roundId = 1;
  const userId = 11;

  const mockQuotaRoundRepo: any = {
    getAllocationsByRoundId: jest.fn(),
    submitQuotaRoundAllZones: jest.fn(),
    getQuotaConfigByRoundId: jest
      .fn()
      .mockResolvedValue({ id: 10, locationType: '00', year: 2026 }),
    getRoundsByConfigId: jest.fn().mockResolvedValue([
      {
        id: roundId,
        name: 'R1',
        startMonth: '01',
        endMonth: '03',
        dueDate: new Date(),
      },
    ]),
  };

  const mockMasterRepo: any = {
    getZones: jest.fn().mockResolvedValue([{ zoneId: 1, zoneCode: 'Z1' }]),
    getCommonCodeName: jest.fn().mockResolvedValue({ name: 'Location A' }),
  };

  const mockQuotaAllocationRepo: any = {
    getQuotaAllocationsForRoundStatusCheck: jest.fn(),
    updateQuotaRoundStatus: jest.fn().mockResolvedValue(undefined),
  };

  const mockCreateWorkflow: any = { handler: jest.fn() };
  const mockWorkflowApproval: any = { handler: jest.fn() };
  const mockGetCurrentWorkflowStep: any = { handler: jest.fn() };
  const mockWorkflowSendMail: any = { handler: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    usecase = new SubmitQuotaRoundAllZonesUseCase(
      mockQuotaRoundRepo,
      mockMasterRepo,
      mockQuotaAllocationRepo,
      mockCreateWorkflow,
      mockWorkflowApproval,
      mockGetCurrentWorkflowStep,
      mockWorkflowSendMail,
    );
  });

  it('should update quota round status to 3 when all allocations meet closing criteria', async () => {
    mockQuotaRoundRepo.getAllocationsByRoundId.mockResolvedValue([{ id: 1, zoneId: 1 }]);
    mockGetCurrentWorkflowStep.handler.mockResolvedValue({
      success: true,
      data: { wfTransactionId: 999 },
    });
    mockWorkflowApproval.handler.mockResolvedValue({ success: true, route: {} });
    mockQuotaRoundRepo.submitQuotaRoundAllZones.mockResolvedValue([]);
    mockQuotaAllocationRepo.getQuotaAllocationsForRoundStatusCheck.mockResolvedValue([
      { id: 1, wfComplete: 'Y', quotaAssign: 0, annualTarget: 0 },
    ]);

    const result = await usecase.handler(roundId, userId, []);

    expect(result.success).toBe(true);
    expect(mockQuotaAllocationRepo.updateQuotaRoundStatus).toHaveBeenCalledWith(
      roundId,
      3,
    );
  });

  it('should NOT update quota round status if not all allocations meet criteria', async () => {
    mockQuotaRoundRepo.getAllocationsByRoundId.mockResolvedValue([{ id: 1, zoneId: 1 }]);
    mockGetCurrentWorkflowStep.handler.mockResolvedValue({
      success: true,
      data: { wfTransactionId: 999 },
    });
    mockWorkflowApproval.handler.mockResolvedValue({ success: true, route: {} });
    mockQuotaRoundRepo.submitQuotaRoundAllZones.mockResolvedValue([]);
    mockQuotaAllocationRepo.getQuotaAllocationsForRoundStatusCheck.mockResolvedValue([
      { id: 1, wfTransactionId: null, wfComplete: null, quotaAssign: 0, annualTarget: 5 },
    ]);

    const result = await usecase.handler(roundId, userId, []);

    expect(result.success).toBe(true);
    expect(mockQuotaAllocationRepo.updateQuotaRoundStatus).not.toHaveBeenCalled();
  });
});
