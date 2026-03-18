import { Test, TestingModule } from '@nestjs/testing';
import { CloseQuotaConfigUseCase } from './closeQuotaConfig.usecase';
import { QuotaException } from '../../../common/exceptions/quota.exception';

describe('CloseQuotaConfigUseCase', () => {
  let useCase: CloseQuotaConfigUseCase;

  const quotaRoundRepoMock = {
    getQuotaConfig: jest.fn(),
    getRoundsByConfigId: jest.fn(),
    closeQuotaConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloseQuotaConfigUseCase,
        {
          provide: 'QuotaRoundRepository',
          useValue: quotaRoundRepoMock,
        },
      ],
    }).compile();

    useCase = module.get(CloseQuotaConfigUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should call repository and return success response', async () => {
    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 1 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      { quotaRoundStatusId: 3 },
    ]);
    quotaRoundRepoMock.closeQuotaConfig.mockResolvedValueOnce(undefined);

    const result = await useCase.handler(2026, '01', '02', 1001);

    expect(quotaRoundRepoMock.closeQuotaConfig).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.closeQuotaConfig).toHaveBeenCalledWith(
      2026,
      '01',
      '02',
      1001,
    );

    expect(result).toEqual({
      success: true,
      code: 'YEAR_SCOPE_CLOSED',
      message: 'Quota year scope closed successfully',
    });
  });

  it('should map QuotaException into error response', async () => {
    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 1 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      { quotaRoundStatusId: 3 },
    ]);
    quotaRoundRepoMock.closeQuotaConfig.mockRejectedValueOnce(
      new QuotaException('INVALID_STATE', 'Cannot close at this status'),
    );

    const result = await useCase.handler(2026, '01', '02', 1001);

    expect(quotaRoundRepoMock.closeQuotaConfig).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: false,
      error: {
        code: 'INVALID_STATE',
        message: 'Cannot close at this status',
      },
    });
  });

  it('should map non-QuotaException errors using error.code and error.message when present', async () => {
    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 1 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      { quotaRoundStatusId: 3 },
    ]);
    quotaRoundRepoMock.closeQuotaConfig.mockRejectedValueOnce({
      code: 'SOME_DB_ERROR',
      message: 'db failed',
    });

    const result = await useCase.handler(2026, '01', '02', 1001);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'SOME_DB_ERROR',
        message: 'db failed',
      },
    });
  });

  it('should fallback to DATA_ACCESS_ERROR and default message when non-QuotaException missing fields', async () => {
    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 1 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      { quotaRoundStatusId: 3 },
    ]);
    quotaRoundRepoMock.closeQuotaConfig.mockRejectedValueOnce(new Error());

    const result = await useCase.handler(2026, '01', '02', 1001);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'DATA_ACCESS_ERROR',
        message: 'An error occurred while closing Quota config',
      },
    });
  });

  it('should not throw even when repository rejects (it returns error response instead)', async () => {
    quotaRoundRepoMock.closeQuotaConfig.mockRejectedValueOnce(new Error('boom'));

    await expect(useCase.handler(2026, '01', '02', 1001)).resolves.toMatchObject({
      success: false,
      error: {
        code: expect.any(String),
        message: expect.any(String),
      },
    });
  });
});
