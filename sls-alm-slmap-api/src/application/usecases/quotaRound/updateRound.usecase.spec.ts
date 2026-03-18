import { Test, TestingModule } from '@nestjs/testing';
import { UpdateRoundUsecase } from './updateRound.usecase';
import { QuotaException } from '../../../common/exceptions/quota.exception';

describe('UpdateRoundUsecase', () => {
  let useCase: UpdateRoundUsecase;

  const quotaRoundRepoMock = {
    updateRound: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateRoundUsecase,
        {
          provide: 'QuotaRoundRepository',
          useValue: quotaRoundRepoMock,
        },
      ],
    }).compile();

    useCase = module.get(UpdateRoundUsecase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should call repository.updateRound and return success response', async () => {
    quotaRoundRepoMock.updateRound.mockResolvedValueOnce(undefined);

    const round: any = {
      id: 1,
      name: 'Round 1',
      startMonth: 1,
      endMonth: 3,
      allocations: [],
    };

    const userId = 10;

    await expect(useCase.handler(round, userId)).resolves.toEqual({
      success: true,
      code: 'ROUND_UPDATED',
      message: 'Quota round updated successfully',
    });

    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledWith(round, userId);
  });

  it('should still call repository.updateRound when userId is omitted and return success response', async () => {
    quotaRoundRepoMock.updateRound.mockResolvedValueOnce(undefined);

    const round: any = { id: 2, name: 'Round 2' };

    await expect(useCase.handler(round)).resolves.toEqual({
      success: true,
      code: 'ROUND_UPDATED',
      message: 'Quota round updated successfully',
    });

    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledWith(round, undefined);
  });

  it('should return structured error when repository throws QuotaException', async () => {
    quotaRoundRepoMock.updateRound.mockRejectedValueOnce(
      new QuotaException('ROUND_INVALID', 'Round invalid'),
    );

    const round: any = { id: 3, name: 'Bad round' };

    await expect(useCase.handler(round, 10)).resolves.toEqual({
      success: false,
      error: {
        code: 'ROUND_INVALID',
        message: 'Round invalid',
      },
    });

    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledWith(round, 10);
  });

  it('should return DATA_ACCESS_ERROR when repository throws unknown error without code', async () => {
    quotaRoundRepoMock.updateRound.mockRejectedValueOnce(
      new Error('Database connection failed'),
    );

    const round: any = { id: 4, name: 'Round 4' };

    await expect(useCase.handler(round, 10)).resolves.toEqual({
      success: false,
      error: {
        code: 'DATA_ACCESS_ERROR',
        message: 'Database connection failed',
      },
    });

    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledWith(round, 10);
  });

  it('should return provided error.code when repository throws error containing code', async () => {
    quotaRoundRepoMock.updateRound.mockRejectedValueOnce({
      code: 'SOME_CODE',
      message: 'Something went wrong',
    });

    const round: any = { id: 5, name: 'Round 5' };

    await expect(useCase.handler(round, 10)).resolves.toEqual({
      success: false,
      error: {
        code: 'SOME_CODE',
        message: 'Something went wrong',
      },
    });

    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledWith(round, 10);
  });

  it('should fallback unknown error message when repository throws non-standard error without message', async () => {
    quotaRoundRepoMock.updateRound.mockRejectedValueOnce({
      code: undefined,
      message: undefined,
    });

    const round: any = { id: 6, name: 'Round 6' };

    await expect(useCase.handler(round, 10)).resolves.toEqual({
      success: false,
      error: {
        code: 'DATA_ACCESS_ERROR',
        message: 'An error occurred while saving quota data',
      },
    });

    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.updateRound).toHaveBeenCalledWith(round, 10);
  });
});
