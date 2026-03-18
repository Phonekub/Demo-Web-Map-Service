import { SubmitRoundByZoneUseCase } from './submitRoundByZone.usecase';

describe('SubmitRoundByZoneUseCase', () => {
  let usecase: SubmitRoundByZoneUseCase;
  const roundId = 1;
  const zoneId = 2;
  const userId = 11;

  const mockQuotaRoundRepo: any = {
    submitQuotaRoundByZone: jest.fn(),
    getQuotaConfigByRoundId: jest
      .fn()
      .mockResolvedValue({ id: 10, locationType: '00', year: 2026 }),
    getRoundsByConfigId: jest
      .fn()
      .mockResolvedValue([
        { id: roundId, name: 'R1', startMonth: 1, endMonth: 3, dueDate: new Date() },
      ]),
  };

  const mockMasterRepo: any = {
    getZones: jest.fn().mockResolvedValue([{ zoneId, zoneCode: 'Z2' }]),
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

    usecase = new SubmitRoundByZoneUseCase(
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
    mockQuotaRoundRepo.submitQuotaRoundByZone.mockResolvedValue({
      id: 123,
      assignedQuota: 0,
      zoneId,
    });

    mockGetCurrentWorkflowStep.handler.mockResolvedValue({
      success: true,
      data: { wfTransactionId: 999 },
    });
    mockWorkflowApproval.handler.mockResolvedValue({ success: true, route: {} });

    mockQuotaAllocationRepo.getQuotaAllocationsForRoundStatusCheck.mockResolvedValue([
      { id: 1, wfTransactionId: 10, wfComplete: 'Y', quotaAssign: 0, annualTarget: 0 },
      { id: 2, wfTransactionId: null, wfComplete: null, quotaAssign: 0, annualTarget: 0 },
    ]);

    const result = await usecase.handler(roundId, zoneId, userId);

    expect(result.success).toBe(true);
    expect(
      mockQuotaAllocationRepo.getQuotaAllocationsForRoundStatusCheck,
    ).toHaveBeenCalledWith(roundId);
    expect(mockQuotaAllocationRepo.updateQuotaRoundStatus).toHaveBeenCalledWith(
      roundId,
      3,
    );
  });

  it('should NOT update quota round status if not all allocations meet criteria', async () => {
    mockQuotaRoundRepo.submitQuotaRoundByZone.mockResolvedValue({
      id: 123,
      assignedQuota: 0,
      zoneId,
    });

    mockGetCurrentWorkflowStep.handler.mockResolvedValue({
      success: true,
      data: { wfTransactionId: 999 },
    });
    mockWorkflowApproval.handler.mockResolvedValue({ success: true, route: {} });

    mockQuotaAllocationRepo.getQuotaAllocationsForRoundStatusCheck.mockResolvedValue([
      // ensure at least one allocation does NOT meet closing criteria
      { id: 1, wfTransactionId: 10, wfComplete: 'Y', quotaAssign: 0, annualTarget: 0 },
      { id: 2, wfTransactionId: null, wfComplete: null, quotaAssign: 0, annualTarget: 5 },
    ]);

    const result = await usecase.handler(roundId, zoneId, userId);

    expect(result.success).toBe(true);
    expect(
      mockQuotaAllocationRepo.getQuotaAllocationsForRoundStatusCheck,
    ).toHaveBeenCalledWith(roundId);
    expect(mockQuotaAllocationRepo.updateQuotaRoundStatus).not.toHaveBeenCalled();
  });
});
