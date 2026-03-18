import { Test, TestingModule } from '@nestjs/testing';
import { CreateRoundUseCase } from './createRound.usecase';
import {
  CatalogNotFoundException,
  QuotaException,
  QuotaNotFoundException,
} from '../../../common/exceptions/quota.exception';

describe('CreateRoundUseCase', () => {
  let useCase: CreateRoundUseCase;

  const quotaRoundRepoMock = {
    getQuotaConfig: jest.fn(),
    getRoundsByConfigId: jest.fn(),
    getLasetRoundSeq: jest.fn(),
    createRound: jest.fn(),
  };

  const masterRepositoryMock = {
    getCommonCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRoundUseCase,
        { provide: 'QuotaRoundRepository', useValue: quotaRoundRepoMock },
        { provide: 'MasterRepository', useValue: masterRepositoryMock },
      ],
    }).compile();

    useCase = module.get(CreateRoundUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  const makeBaseParams = () => ({
    year: 2026,
    locationType: '01',
    quotaType: '02',
  });

  it('should create a new round with seq=lastSeq+1 and map allocations without previous reserve items when no previous round', async () => {
    const quotaQueryParams = makeBaseParams();

    // validateCatalogTypes calls masterRepository.getCommonCode twice (locationType, quotaType)
    masterRepositoryMock.getCommonCode
      .mockResolvedValueOnce([{ value: '01' }])
      .mockResolvedValueOnce([{ value: '02' }]);

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 55 });

    // No previous rounds effectively used for reserve-copying; still return something to populate roundsMap
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([]);
    quotaRoundRepoMock.getLasetRoundSeq.mockResolvedValueOnce(0);

    quotaRoundRepoMock.createRound.mockResolvedValueOnce([{ id: 999 }]);

    const round = {
      name: 'Round A',
      startMonth: 1,
      endMonth: 3,
      allocations: [
        { zoneId: 10, assignedQuota: 5, reservedQuota: 1 },
        { zoneId: 11, assignedQuota: 6, reservedQuota: 2 },
      ],
    } as any;

    const result = await useCase.handler(round, quotaQueryParams as any, 7);

    expect(masterRepositoryMock.getCommonCode).toHaveBeenCalledTimes(2);
    expect(quotaRoundRepoMock.getQuotaConfig).toHaveBeenCalledWith(
      quotaQueryParams.year,
      quotaQueryParams.locationType,
      quotaQueryParams.quotaType,
    );
    expect(quotaRoundRepoMock.getRoundsByConfigId).toHaveBeenCalledWith(55);
    expect(quotaRoundRepoMock.getLasetRoundSeq).toHaveBeenCalledWith(55);

    expect(quotaRoundRepoMock.createRound).toHaveBeenCalledTimes(1);

    const [savedRounds] = quotaRoundRepoMock.createRound.mock.calls[0];
    expect(Array.isArray(savedRounds)).toBe(true);
    expect(savedRounds).toHaveLength(1);

    const saved = savedRounds[0];
    // core round mapping
    expect(saved.name).toBe('Round A');
    expect(saved.startMonth).toBe(1);
    expect(saved.endMonth).toBe(3);
    expect(saved.seq).toBe(1);
    expect(saved.isReview).toBe('N');
    expect(saved.quotaRoundStatusId).toBe(1);
    expect(saved.createBy).toBe(7);
    expect(saved.updateBy).toBe(7);
    expect(saved.quotaConfig?.id).toBe(55);

    // allocations mapping
    expect(saved.allocations).toHaveLength(2);
    expect(saved.allocations[0]).toEqual(
      expect.objectContaining({
        zoneId: 10,
        assignedQuota: 5,
        reservedQuota: 1,
      }),
    );
    expect(saved.allocations[1]).toEqual(
      expect.objectContaining({
        zoneId: 11,
        assignedQuota: 6,
        reservedQuota: 2,
      }),
    );

    // no previous reserve items should be copied
    expect(saved.allocations[0].quotaAllocationItems).toBeUndefined();
    expect(saved.allocations[1].quotaAllocationItems).toBeUndefined();

    expect(result).toEqual({
      round_id: 999,
      success: true,
      code: 'ROUND_CREATED',
      message: 'Quota round created successfully',
    });
  });

  it('should copy RESERVE allocation items from previous round for matching zone', async () => {
    const quotaQueryParams = makeBaseParams();

    masterRepositoryMock.getCommonCode
      .mockResolvedValueOnce([{ value: '01' }])
      .mockResolvedValueOnce([{ value: '02' }]);

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 77 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([
      {
        seq: 5,
        allocations: [
          {
            zoneId: 10,
            quotaAllocationItems: [
              {
                id: 5001,
                type: 'RESERVE',
                seq: 1,
                openType: 'A',
                createBy: 99,
                poiId: 12,
              },
              { id: 5002, type: 'OPEN', seq: 2, openType: 'B', poiId: 13 },

              {
                id: 5003,
                type: 'RESERVE',
                seq: 3,
                openType: 'C',
                createBy: 99,
                poiId: 14,
              },
            ],
          },
          {
            zoneId: 99,
            quotaAllocationItems: [{ type: 'RESERVE', seq: 9, openType: 'Z' }],
          },
        ],
      },
    ]);

    quotaRoundRepoMock.getLasetRoundSeq.mockResolvedValueOnce(5);
    quotaRoundRepoMock.createRound.mockResolvedValueOnce([{ id: 1000 }]);

    const round = {
      name: 'Round B',
      startMonth: 4,
      endMonth: 6,
      allocations: [{ zoneId: 10, assignedQuota: 1, reservedQuota: 0 }],
    } as any;

    await useCase.handler(round, quotaQueryParams as any, 123);

    const [savedRounds] = quotaRoundRepoMock.createRound.mock.calls[0];
    const saved = savedRounds[0];
    expect(saved.seq).toBe(6);

    expect(saved.allocations).toHaveLength(1);
    const savedAlloc = saved.allocations[0];

    // copied only RESERVE items; createBy should be userId; seq/openType preserved
    expect(savedAlloc.quotaAllocationItems).toHaveLength(2);
    expect(savedAlloc.quotaAllocationItems[0]).toEqual(
      expect.objectContaining({
        id: 5001,
        type: 'RESERVE',
        seq: 1,
        openType: 'A',
        createBy: 99,
        updateBy: 123,
        poiId: 12,
      }),
    );

    expect(savedAlloc.quotaAllocationItems[1]).toEqual(
      expect.objectContaining({
        id: 5003,
        type: 'RESERVE',
        seq: 3,
        openType: 'C',
        createBy: 99,
        updateBy: 123,
        poiId: 14,
      }),
    );

    expect(savedAlloc.quotaAllocationItems[0].updateBy).toBe(123);
    expect(savedAlloc.quotaAllocationItems[0].createBy).toBe(99);
  });

  it('should create a round even when allocations are missing/empty', async () => {
    const quotaQueryParams = makeBaseParams();

    masterRepositoryMock.getCommonCode
      .mockResolvedValueOnce([{ value: '01' }])
      .mockResolvedValueOnce([{ value: '02' }]);

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 1 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([]);
    quotaRoundRepoMock.getLasetRoundSeq.mockResolvedValueOnce(2);
    quotaRoundRepoMock.createRound.mockResolvedValueOnce([{ id: 3 }]);

    const round = { name: 'No Allos', startMonth: 1, endMonth: 1 } as any;

    const result = await useCase.handler(round, quotaQueryParams as any, 1);

    const [savedRounds] = quotaRoundRepoMock.createRound.mock.calls[0];
    expect(savedRounds[0].allocations).toBeUndefined();
    expect(savedRounds[0].seq).toBe(3);

    expect(result).toEqual({
      round_id: 3,
      success: true,
      code: 'ROUND_CREATED',
      message: 'Quota round created successfully',
    });
  });

  it('should return error response when catalog validation fails for locationType', async () => {
    const quotaQueryParams = makeBaseParams();

    masterRepositoryMock.getCommonCode.mockResolvedValueOnce([{ value: '99' }]); // does not include '01'

    const result = await useCase.handler(
      { name: 'X', startMonth: 1, endMonth: 1 } as any,
      quotaQueryParams as any,
      1,
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 'CATALOG_NOT_FOUND',
        message: 'Location types not found in catalog: 01',
      },
    });

    expect(quotaRoundRepoMock.getQuotaConfig).not.toHaveBeenCalled();
    expect(quotaRoundRepoMock.createRound).not.toHaveBeenCalled();
  });

  it('should return error response when catalog validation fails for quotaType (second validation)', async () => {
    const quotaQueryParams = makeBaseParams();

    // First validation (locationType) passes, second (quotaType) fails.
    masterRepositoryMock.getCommonCode
      .mockResolvedValueOnce([{ value: '01' }])
      .mockResolvedValueOnce([{ value: '99' }]); // does not include '02'

    const result = await useCase.handler(
      { name: 'X', startMonth: 1, endMonth: 1 } as any,
      quotaQueryParams as any,
      1,
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 'CATALOG_NOT_FOUND',
        message: 'Location types not found in catalog: 02',
      },
    });

    expect(quotaRoundRepoMock.getQuotaConfig).not.toHaveBeenCalled();
    expect(quotaRoundRepoMock.createRound).not.toHaveBeenCalled();
  });

  it('should return error response when quota config not found', async () => {
    const quotaQueryParams = makeBaseParams();

    masterRepositoryMock.getCommonCode
      .mockResolvedValueOnce([{ value: '01' }])
      .mockResolvedValueOnce([{ value: '02' }]);

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce(null);

    const result = await useCase.handler(
      { name: 'R', startMonth: 1, endMonth: 1, allocations: [] } as any,
      quotaQueryParams as any,
      1,
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 'QUOTA_NOT_FOUND',
        message: 'Quota config not found',
      },
    });

    expect(quotaRoundRepoMock.getRoundsByConfigId).not.toHaveBeenCalled();
    expect(quotaRoundRepoMock.createRound).not.toHaveBeenCalled();
  });

  it('should return QuotaException error payload (generic QuotaException branch)', async () => {
    const quotaQueryParams = makeBaseParams();

    masterRepositoryMock.getCommonCode
      .mockResolvedValueOnce([{ value: '01' }])
      .mockResolvedValueOnce([{ value: '02' }]);

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 9 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([]);
    quotaRoundRepoMock.getLasetRoundSeq.mockResolvedValueOnce(0);

    quotaRoundRepoMock.createRound.mockRejectedValueOnce(
      new QuotaException('SOME_CODE', 'some message'),
    );

    const result = await useCase.handler(
      { name: 'R', startMonth: 1, endMonth: 1 } as any,
      quotaQueryParams as any,
      1,
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 'SOME_CODE',
        message: 'some message',
      },
    });
  });

  it('should return DATA_ACCESS_ERROR for unknown errors lacking a code', async () => {
    const quotaQueryParams = makeBaseParams();

    masterRepositoryMock.getCommonCode
      .mockResolvedValueOnce([{ value: '01' }])
      .mockResolvedValueOnce([{ value: '02' }]);

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 9 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([]);
    quotaRoundRepoMock.getLasetRoundSeq.mockResolvedValueOnce(0);

    quotaRoundRepoMock.createRound.mockRejectedValueOnce(new Error('boom'));

    const result = await useCase.handler(
      { name: 'R', startMonth: 1, endMonth: 1 } as any,
      quotaQueryParams as any,
      1,
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 'DATA_ACCESS_ERROR',
        message: 'boom',
      },
    });
  });

  it('should return provided error.code when unknown error has code property', async () => {
    const quotaQueryParams = makeBaseParams();

    masterRepositoryMock.getCommonCode
      .mockResolvedValueOnce([{ value: '01' }])
      .mockResolvedValueOnce([{ value: '02' }]);

    quotaRoundRepoMock.getQuotaConfig.mockResolvedValueOnce({ id: 9 });
    quotaRoundRepoMock.getRoundsByConfigId.mockResolvedValueOnce([]);
    quotaRoundRepoMock.getLasetRoundSeq.mockResolvedValueOnce(0);

    quotaRoundRepoMock.createRound.mockRejectedValueOnce({
      code: 'CUSTOM',
      message: 'custom msg',
    });

    const result = await useCase.handler(
      { name: 'R', startMonth: 1, endMonth: 1 } as any,
      quotaQueryParams as any,
      1,
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: 'CUSTOM',
        message: 'custom msg',
      },
    });
  });
});
