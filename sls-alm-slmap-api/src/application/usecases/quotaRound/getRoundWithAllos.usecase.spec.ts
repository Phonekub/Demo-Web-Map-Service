import { Test, TestingModule } from '@nestjs/testing';
import { GetRoundWithAllosUseCase } from './getRoundWithAllos.usecase';
import { Language } from '../../../common/enums/language.enum';

describe('GetRoundWithAllosUseCase', () => {
  let useCase: GetRoundWithAllosUseCase;

  const quotaRoundRepoMock = {
    getRoundsWithAllocations: jest.fn(),
  };

  const getCurrentWorkflowStepUseCaseMock = {
    handler: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRoundWithAllosUseCase,
        {
          provide: 'QuotaRoundRepository',
          useValue: quotaRoundRepoMock,
        },
        {
          provide: require('../workflow/getCurrentWorkflowStep.usecase')
            .GetCurrentWorkflowStepUseCase,
          useValue: getCurrentWorkflowStepUseCaseMock,
        },
      ],
    }).compile();

    useCase = module.get(GetRoundWithAllosUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should call repository with provided args and return rounds (no allocations -> no workflow calls)', async () => {
    const roundsData = [
      {
        id: 1,
        name: 'R1',
        allocations: [],
      },
    ];

    quotaRoundRepoMock.getRoundsWithAllocations.mockResolvedValueOnce(roundsData);

    const result = await useCase.handler(2026, '01', '01', 999, Language.TH);

    expect(quotaRoundRepoMock.getRoundsWithAllocations).toHaveBeenCalledTimes(1);
    expect(quotaRoundRepoMock.getRoundsWithAllocations).toHaveBeenCalledWith(
      2026,
      '01',
      '01',
      Language.TH,
    );

    expect(getCurrentWorkflowStepUseCaseMock.handler).not.toHaveBeenCalled();
    expect(result).toBe(roundsData);
  });

  it('should map workflow status onto allocations when workflow step returns success', async () => {
    const roundsData = [
      {
        id: 1,
        name: 'Round A',
        allocations: [
          {
            allocationId: 101,
            wfStatus: { id: 0, name: '', wfComplete: false },
          },
          {
            allocationId: 102,
            wfStatus: { id: 0, name: '', wfComplete: false },
          },
        ],
      },
      {
        id: 2,
        name: 'Round B',
        allocations: [
          {
            allocationId: 201,
            wfStatus: { id: 0, name: '', wfComplete: false },
          },
        ],
      },
    ];

    quotaRoundRepoMock.getRoundsWithAllocations.mockResolvedValueOnce(roundsData);

    getCurrentWorkflowStepUseCaseMock.handler
      .mockResolvedValueOnce({
        success: true,
        data: {
          wfStatus: {
            wfStatusId: 11,
            wfStatusName: 'IN_PROGRESS',
            wfComplete: false,
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          wfStatus: {
            wfStatusId: 22,
            wfStatusName: 'DONE',
            wfComplete: true,
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          wfStatus: {
            wfStatusId: 33,
            wfStatusName: 'PENDING',
            wfComplete: false,
          },
        },
      });

    const result = await useCase.handler(2026, '01', '01', 777, Language.EN);

    expect(result).toBe(roundsData);

    expect(getCurrentWorkflowStepUseCaseMock.handler).toHaveBeenCalledTimes(3);
    expect(getCurrentWorkflowStepUseCaseMock.handler).toHaveBeenNthCalledWith(
      1,
      101,
      [5],
      777,
    );
    expect(getCurrentWorkflowStepUseCaseMock.handler).toHaveBeenNthCalledWith(
      2,
      102,
      [5],
      777,
    );
    expect(getCurrentWorkflowStepUseCaseMock.handler).toHaveBeenNthCalledWith(
      3,
      201,
      [5],
      777,
    );

    expect(roundsData[0].allocations[0].wfStatus).toEqual({
      id: 11,
      name: 'IN_PROGRESS',
      wfComplete: false,
    });
    expect(roundsData[0].allocations[1].wfStatus).toEqual({
      id: 22,
      name: 'DONE',
      wfComplete: true,
    });
    expect(roundsData[1].allocations[0].wfStatus).toEqual({
      id: 33,
      name: 'PENDING',
      wfComplete: false,
    });
  });

  it('should not update allocation wfStatus when workflow step returns success=false', async () => {
    const roundsData = [
      {
        id: 1,
        name: 'Round',
        allocations: [
          {
            allocationId: 101,
            wfStatus: { id: 9, name: 'OLD', wfComplete: true },
          },
        ],
      },
    ];

    quotaRoundRepoMock.getRoundsWithAllocations.mockResolvedValueOnce(roundsData);
    getCurrentWorkflowStepUseCaseMock.handler.mockResolvedValueOnce({
      success: false,
      error: { code: 'WF_ERROR', message: 'nope' },
    });

    const result = await useCase.handler(2026, '01', '01', 1, Language.TH);

    expect(result).toBe(roundsData);
    expect(getCurrentWorkflowStepUseCaseMock.handler).toHaveBeenCalledTimes(1);

    // unchanged
    expect(roundsData[0].allocations[0].wfStatus).toEqual({
      id: 9,
      name: 'OLD',
      wfComplete: true,
    });
  });

  it('should catch and log workflow step errors and continue processing other allocations', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      // keep output clean while still exercising the branch
      .mockImplementation(() => undefined);

    const roundsData = [
      {
        id: 1,
        name: 'Round',
        allocations: [
          {
            allocationId: 101,
            wfStatus: { id: 0, name: '', wfComplete: false },
          },
          {
            allocationId: 102,
            wfStatus: { id: 0, name: '', wfComplete: false },
          },
        ],
      },
    ];

    quotaRoundRepoMock.getRoundsWithAllocations.mockResolvedValueOnce(roundsData);

    getCurrentWorkflowStepUseCaseMock.handler
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({
        success: true,
        data: {
          wfStatus: { wfStatusId: 55, wfStatusName: 'OK', wfComplete: false },
        },
      });

    const result = await useCase.handler(2026, '01', '01', 99);

    expect(result).toBe(roundsData);

    expect(getCurrentWorkflowStepUseCaseMock.handler).toHaveBeenCalledTimes(2);

    // first allocation stays unchanged due to error
    expect(roundsData[0].allocations[0].wfStatus).toEqual({
      id: 0,
      name: '',
      wfComplete: false,
    });

    // second allocation updated
    expect(roundsData[0].allocations[1].wfStatus).toEqual({
      id: 55,
      name: 'OK',
      wfComplete: false,
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error fetching wf for allo 101');

    consoleErrorSpy.mockRestore();
  });
});
