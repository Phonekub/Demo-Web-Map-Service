import { Test, TestingModule } from '@nestjs/testing';
import { SubmitReviewRoundsByZoneUseCase } from './submitReviewRoundsByZone.usecase';
import {
  QuotaException,
  QuotaNotFoundException,
} from '../../../common/exceptions/quota.exception';
import { Language } from '../../../common/enums/language.enum';

describe('SubmitReviewRoundsByZoneUseCase', () => {
  let useCase: SubmitReviewRoundsByZoneUseCase;

  const quotaRoundRepoMock = {
    getQuotaConfig: jest.fn(),
    getRoundsByConfigId: jest.fn(),
    createRound: jest.fn(),
  };

  const masterRepoMock = {
    getZones: jest.fn(),
    getCommonCodeName: jest.fn(),
  };

  const createWorkFlowUsecaseMock = { handler: jest.fn() };
  const workflowApprovalUseCaseMock = { handler: jest.fn() };
  const getCurrentWorkflowStepUseCaseMock = { handler: jest.fn() };
  const workflowSendMailUseCaseMock = { handler: jest.fn() };

  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitReviewRoundsByZoneUseCase,
        { provide: 'QuotaRoundRepository', useValue: quotaRoundRepoMock },
        { provide: 'MasterRepository', useValue: masterRepoMock },
        {
          provide: require('../workflow/createWorkflowTransaction.usecase')
            .CreateWorkflowTransactionUseCase,
          useValue: createWorkFlowUsecaseMock,
        },
        {
          provide: require('../workflow/workflowApproval.usecase')
            .WorkflowApprovalUseCase,
          useValue: workflowApprovalUseCaseMock,
        },
        {
          provide: require('../workflow/getCurrentWorkflowStep.usecase')
            .GetCurrentWorkflowStepUseCase,
          useValue: getCurrentWorkflowStepUseCaseMock,
        },
        {
          provide: require('../workflow/workflowSendMail.usecase')
            .WorkflowSendMailUseCase,
          useValue: workflowSendMailUseCaseMock,
        },
      ],
    }).compile();

    useCase = module.get(SubmitReviewRoundsByZoneUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseArgs = () => ({
    year: 2026,
    locationType: '01',
    quotaType: '02',
    zoneId: 10,
    userId: 999,
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return error when config not found', async () => {
    const { year, locationType, quotaType, zoneId, userId } = baseArgs();
    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce(null);

    const result = await useCase.handler(year, locationType, quotaType, zoneId, userId);

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('QUOTA_NOT_FOUND');
  });

  it('should create new review round and trigger workflow (happy path)', async () => {
    const { year, locationType, quotaType, zoneId, userId } = baseArgs();

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({
      id: 77,
      locationType: '01',
    });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      {
        id: 1,
        name: 'R1',
        isReview: 'N',
        seq: 1,
        allocations: [{ zoneId, assignedQuota: 5, quotaAllocationItems: [] }],
      },
    ]);

    quotaRoundRepoMock.createRound.mockImplementation(async (rounds) => {
      const r = rounds[0];
      r.allocations = r.allocations.map((a) => ({ ...a, id: 888 }));
      return [r];
    });

    masterRepoMock.getZones.mockResolvedValueOnce([{ zoneId, zoneCode: 'Z10' }]);
    createWorkFlowUsecaseMock.handler.mockResolvedValueOnce({
      success: true,
      data: { wfTransactionId: 5001 },
    });
    workflowApprovalUseCaseMock.handler.mockResolvedValueOnce({
      success: true,
      route: {},
    });

    const result = await useCase.handler(year, locationType, quotaType, zoneId, userId);

    expect(result.success).toBe(true);
    expect(quotaRoundRepoMock.createRound).toHaveBeenCalled();
    const [roundsToSave] = quotaRoundRepoMock.createRound.mock.calls[0];
    expect(roundsToSave[0].name).toBe('ทบทวน');
  });

  it('should early-return when zone already submitted', async () => {
    const { year, locationType, quotaType, zoneId, userId } = baseArgs();

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 77 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      { id: 1, isReview: 'N', seq: 1, allocations: [{ zoneId }] },
      { id: 2, isReview: 'Y', seq: 2, allocations: [{ zoneId }] },
    ]);

    const result = await useCase.handler(year, locationType, quotaType, zoneId, userId);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Zone already submitted for review');
    expect(quotaRoundRepoMock.createRound).not.toHaveBeenCalled();
  });

  it('should handle DATA_ACCESS_ERROR on generic failure', async () => {
    const { year, locationType, quotaType, zoneId, userId } = baseArgs();
    quotaRoundRepoMock.getQuotaConfig.mockRejectedValueOnce(new Error('DB Error'));

    const result = await useCase.handler(year, locationType, quotaType, zoneId, userId);

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('DATA_ACCESS_ERROR');
  });
});
