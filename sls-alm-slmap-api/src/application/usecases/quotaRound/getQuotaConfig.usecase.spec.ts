import { Test, TestingModule } from '@nestjs/testing';
import { GetQuotaConfigUseCase } from './getQuotaConfig.usecase';
import { Language } from '../../../common/enums/language.enum';

describe('GetQuotaConfigUseCase', () => {
  let useCase: GetQuotaConfigUseCase;

  const quotaRoundRepositoryMock = {
    getQuotaConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetQuotaConfigUseCase,
        {
          provide: 'QuotaRoundRepository',
          useValue: quotaRoundRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get(GetQuotaConfigUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delegate to quotaRoundRepository.getQuotaConfig with language when provided', async () => {
    const year = 2026;
    const locationType = '02';
    const quotaType = '01';
    const language = Language.TH;

    const expected = { id: 1, year, locationType: { value: locationType } } as any;
    quotaRoundRepositoryMock.getQuotaConfig.mockResolvedValueOnce(expected);

    await expect(useCase.handler(year, locationType, quotaType, language)).resolves.toBe(
      expected,
    );

    expect(quotaRoundRepositoryMock.getQuotaConfig).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepositoryMock.getQuotaConfig).toHaveBeenCalledWith(
      year,
      locationType,
      quotaType,
      language,
    );
  });

  it('should delegate to quotaRoundRepository.getQuotaConfig with language=undefined when omitted', async () => {
    const year = 2026;
    const locationType = '02';
    const quotaType = '01';

    quotaRoundRepositoryMock.getQuotaConfig.mockResolvedValueOnce(null);

    await expect(useCase.handler(year, locationType, quotaType)).resolves.toBeNull();

    expect(quotaRoundRepositoryMock.getQuotaConfig).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepositoryMock.getQuotaConfig).toHaveBeenCalledWith(
      year,
      locationType,
      quotaType,
      undefined,
    );
  });

  it('should propagate errors thrown by repository', async () => {
    const err: any = new Error('db down');
    quotaRoundRepositoryMock.getQuotaConfig.mockRejectedValueOnce(err);

    await expect(useCase.handler(2026, '02', '01', Language.EN)).rejects.toThrow(
      'db down',
    );
  });
});
