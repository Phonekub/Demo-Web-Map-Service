import { Test, TestingModule } from '@nestjs/testing';
import { SubmitReviewRoundsAllZonesUseCase } from './submitReviewRoundAll.usecase';

describe('SubmitReviewRoundsAllZonesUseCase', () => {
  let useCase: SubmitReviewRoundsAllZonesUseCase;

  const quotaRoundRepoMock = {
    getQuotaConfig: jest.fn(),
    getRoundsByConfigId: jest.fn(),
    getLasetRoundSeq: jest.fn(),
    createRound: jest.fn(),
  };

  const masterRepoMock = {
    getZones: jest.fn(),
    getCommonCodeName: jest.fn(),
  };

  const createWorkflowTransactionUseCaseMock = { handler: jest.fn() };
  const workflowApprovalUseCaseMock = { handler: jest.fn() };
  const workflowSendMailUseCaseMock = { handler: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitReviewRoundsAllZonesUseCase,
        { provide: 'QuotaRoundRepository', useValue: quotaRoundRepoMock },
        { provide: 'MasterRepository', useValue: masterRepoMock },
        {
          provide: require('../workflow/createWorkflowTransaction.usecase')
            .CreateWorkflowTransactionUseCase,
          useValue: createWorkflowTransactionUseCaseMock,
        },
        {
          provide: require('../workflow/workflowApproval.usecase')
            .WorkflowApprovalUseCase,
          useValue: workflowApprovalUseCaseMock,
        },
        {
          provide: require('../workflow/workflowSendMail.usecase')
            .WorkflowSendMailUseCase,
          useValue: workflowSendMailUseCaseMock,
        },
      ],
    }).compile();

    useCase = module.get(SubmitReviewRoundsAllZonesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseArgs = () => ({
    year: 2026,
    locationType: '01',
    quotaType: '02',
    userId: 999,
  });

  it('should create review rounds and trigger workflow (happy path)', async () => {
    const { year, locationType, quotaType, userId } = baseArgs();

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({
      id: 10,
      locationType: '01',
    });

    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      {
        id: 1,
        name: 'R1',
        seq: 1,
        isReview: 'N',
        allocations: [{ zoneId: 1, assignedQuota: 10, reservedQuota: 1 }],
      },
    ]);

    quotaRoundRepoMock.createRound.mockImplementation(async (rounds) => {
      const r = rounds[0];
      r.allocations = r.allocations.map((a, idx) => ({ ...a, id: 500 + idx }));
      return [r];
    });

    masterRepoMock.getZones.mockResolvedValueOnce([{ zoneId: 1, zoneCode: 'Z01' }]);
    masterRepoMock.getCommonCodeName.mockResolvedValueOnce({ name: 'Location A' });
    createWorkflowTransactionUseCaseMock.handler.mockResolvedValue({
      success: true,
      data: { wfTransactionId: 1001 },
    });
    workflowApprovalUseCaseMock.handler.mockResolvedValue({
      success: true,
      route: { wfEmailDetailId: 501 },
    });
    workflowSendMailUseCaseMock.handler.mockResolvedValue(undefined);

    const result = await useCase.handler(year, locationType, quotaType, userId);

    expect(result.success).toBe(true);
    const [roundsToSave] = quotaRoundRepoMock.createRound.mock.calls[0];
    expect(roundsToSave[0].name).toBe('ทบทวน');
    expect(roundsToSave[0].isReview).toBe('Y');
    expect(createWorkflowTransactionUseCaseMock.handler).toHaveBeenCalled();
  });

  it('should handle DATA_ACCESS_ERROR with Thai message', async () => {
    const { year, locationType, quotaType, userId } = baseArgs();
    quotaRoundRepoMock.getQuotaConfig.mockRejectedValueOnce(new Error());

    const result = await useCase.handler(year, locationType, quotaType, userId);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'DATA_ACCESS_ERROR',
        message: 'เกิดข้อผิดพลาดในการส่งข้อมูลทบทวนทั้งหมด',
      },
    });
  });

  it('should return early if all zones already exist in review round', async () => {
    const { year, locationType, quotaType, userId } = baseArgs();
    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 10 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      { id: 1, seq: 1, isReview: 'N', allocations: [{ zoneId: 1 }] },
      { id: 2, seq: 2, isReview: 'Y', allocations: [{ zoneId: 1 }] },
    ]);

    const result = await useCase.handler(year, locationType, quotaType, userId);

    expect(result.success).toBe(true);
    expect(result.message).toBe('ทุก Zone ถูกส่งทบทวนครบถ้วนแล้ว');
    expect(quotaRoundRepoMock.createRound).not.toHaveBeenCalled();
  });
});
