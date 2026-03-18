import { GetWorkflowHistoryUseCase } from './getWorkflowHistory.usecase';

describe('GetWorkflowHistoryUseCase (3A)', () => {
  let mockRepo: any;
  let usecase: GetWorkflowHistoryUseCase;

  beforeEach(() => {
    mockRepo = {
      getWorkflowHistory: jest.fn(),
    };
    usecase = new GetWorkflowHistoryUseCase(mockRepo);
  });

  it('Arrange/Act/Assert - should return mapped histories when repository returns data (success)', async () => {
    // Arrange
    const now = new Date();
    const repoResult = {
      refId: 123,
      histories: [
        {
          id: 1,
          wfTransactionId: 100,
          wfStepId: 1,
          wfStepName: 'Step 1',
          wfStatusId: 10,
          wfStatusName: 'Open',
          wfActionId: 2,
          wfActionName: 'Approve',
          remark: 'ok',
          createBy: 5,
          createByName: 'Alice',
          createDate: now,
        },
      ],
    };

    mockRepo.getWorkflowHistory.mockResolvedValue(repoResult);

    // Act
    const res = await usecase.handler(123, 999, 'th');

    // Assert
    expect(mockRepo.getWorkflowHistory).toHaveBeenCalledWith(123, 999, 'th');
    expect(res).toEqual({
      success: true,
      data: {
        refId: 123,
        histories: [
          {
            id: 1,
            wfTransactionId: 100,
            wfStep: {
              wfStepId: 1,
              wfStepName: 'Step 1',
            },
            wfStatus: {
              wfStatusId: 10,
              wfStatusName: 'Open',
            },
            wfAction: {
              wfActionId: 2,
              wfActionName: 'Approve',
            },
            remark: 'ok',
            createBy: {
              userId: 5,
              name: 'Alice',
            },
            createDate: now,
          },
        ],
      },
    });
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when repository returns null', async () => {
    // Arrange
    mockRepo.getWorkflowHistory.mockResolvedValue(null);

    // Act
    const res = await usecase.handler(200, 999);

    // Assert
    expect(mockRepo.getWorkflowHistory).toHaveBeenCalledWith(200, 999, undefined);
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูล' },
    });
  });

  it('Arrange/Act/Assert - should throw when refId is missing or falsy', async () => {
    // Arrange

    // Act & Assert
    await expect(usecase.handler(undefined as any, 777)).rejects.toThrow(
      'refId is required',
    );
    await expect(usecase.handler(0 as any, 777)).rejects.toThrow('refId is required');
  });

  it('Arrange/Act/Assert - should return DB_ERROR when repository throws', async () => {
    // Arrange
    mockRepo.getWorkflowHistory.mockRejectedValue(new Error('db fail'));

    // Act
    const res = await usecase.handler(300, 666);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'DB_ERROR', message: 'ไม่สามารถดึงข้อมูลได้' },
    });
  });
});
