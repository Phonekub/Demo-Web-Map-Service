import { Test, TestingModule } from '@nestjs/testing';
import { DeleteRoundUseCase } from './deleteRound.usecase';
import { QuotaException } from '../../../common/exceptions/quota.exception';

describe('DeleteRoundUseCase', () => {
  let useCase: DeleteRoundUseCase;

  const quotaRoundRepoMock = {
    deleteRound: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteRoundUseCase,
        {
          provide: 'QuotaRoundRepository',
          useValue: quotaRoundRepoMock,
        },
      ],
    }).compile();

    useCase = module.get(DeleteRoundUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delete round and return success response', async () => {
    quotaRoundRepoMock.deleteRound.mockResolvedValueOnce(undefined);

    const result = await useCase.handler(10, 99);

    expect(quotaRoundRepoMock.deleteRound).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.deleteRound).toHaveBeenCalledWith(10, 99);

    expect(result).toEqual({
      success: true,
      code: 'ROUND_DELETED',
      message: 'Quota round deleted successfully',
    });
  });

  it('should return QuotaException details when repository throws QuotaException', async () => {
    quotaRoundRepoMock.deleteRound.mockRejectedValueOnce(
      new QuotaException('ROUND_LOCKED', 'Round is locked'),
    );

    const result = await useCase.handler(10, 99);

    expect(quotaRoundRepoMock.deleteRound).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.deleteRound).toHaveBeenCalledWith(10, 99);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'ROUND_LOCKED',
        message: 'Round is locked',
      },
    });
  });

  it('should return generic error with provided error.code and error.message when non-QuotaException thrown', async () => {
    quotaRoundRepoMock.deleteRound.mockRejectedValueOnce({
      code: 'SOME_CODE',
      message: 'Something bad happened',
    });

    const result = await useCase.handler(1, 2);

    expect(quotaRoundRepoMock.deleteRound).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual({
      success: false,
      error: {
        code: 'SOME_CODE',
        message: 'Something bad happened',
      },
    });
  });

  it('should fallback to DATA_ACCESS_ERROR and default message when non-QuotaException thrown without code/message', async () => {
    quotaRoundRepoMock.deleteRound.mockRejectedValueOnce({});

    const result = await useCase.handler(1, 2);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'DATA_ACCESS_ERROR',
        message: 'An error occurred while deleting quota data',
      },
    });
  });

  it('should fallback to DATA_ACCESS_ERROR and default message when Error thrown without code', async () => {
    quotaRoundRepoMock.deleteRound.mockRejectedValueOnce(new Error('db down') as any);

    const result = await useCase.handler(1, 2);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'DATA_ACCESS_ERROR',
        message: 'db down',
      },
    });
  });
});
