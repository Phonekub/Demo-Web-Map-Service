import { GetCurrentWorkflowStepUseCase } from './getCurrentWorkflowStep.usecase';

describe('GetCurrentWorkflowStepUseCase (3A)', () => {
  let mockRepo: any;
  let usecase: GetCurrentWorkflowStepUseCase;

  beforeEach(() => {
    mockRepo = {
      getCurrentWorkflowStep: jest.fn(),
    };
    usecase = new GetCurrentWorkflowStepUseCase(mockRepo);
  });

  it('Arrange/Act/Assert - should return mapped data when repository returns a workflow step (success)', async () => {
    // Arrange
    const repoResult = {
      transactionId: 10,
      wfStepId: 5,
      stepName: 'Step A',
      wfStatusId: 2,
      statusName: 'Pending',
      wfComplete: 'W' as const,
      approveBy: 'user1',
      approveType: 'manual',
      canAction: true,
      actions: [{ actionCode: 'APPROVE', actionName: 'Approve', requireRemark: false, isOwner: true }],
    };
    mockRepo.getCurrentWorkflowStep.mockResolvedValue(repoResult);

    // Act
    const res = await usecase.handler(123, [1], 999, 'th');

    // Assert
    expect(mockRepo.getCurrentWorkflowStep).toHaveBeenCalledWith(123, [1], 999, 'th');
    expect(res).toEqual({
      success: true,
      data: {
        wfTransactionId: repoResult.transactionId,
        wfStep: {
          wfStepId: repoResult.wfStepId,
          wfStepName: repoResult.stepName,
        },
        wfStatus: {
          wfStatusId: repoResult.wfStatusId,
          wfStatusName: repoResult.statusName,
          wfComplete: repoResult.wfComplete,
        },
        canAction: repoResult.canAction,
        availableActions: repoResult.actions,
      },
    });
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when repository returns null', async () => {
    // Arrange
    mockRepo.getCurrentWorkflowStep.mockResolvedValue(null);

    // Act
    const res = await usecase.handler(200, [2], 888);

    // Assert
    expect(mockRepo.getCurrentWorkflowStep).toHaveBeenCalledWith(
      200,
      [2],
      888,
      undefined,
    );
    expect(res).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'ไม่พบข้อมูล workflow step ปัจจุบัน',
      },
    });
  });

  it('Arrange/Act/Assert - should throw when refId is missing or falsy', async () => {
    // Arrange
    // no repo setup needed

    // Act & Assert
    await expect(usecase.handler(undefined as any, [1], 777)).rejects.toThrow(
      'refId is required',
    );
    await expect(usecase.handler(0 as any, [1], 777)).rejects.toThrow(
      'refId is required',
    );
  });

  it('Arrange/Act/Assert - should return DB_ERROR when repository throws', async () => {
    // Arrange
    const dbError = new Error('db fail');
    mockRepo.getCurrentWorkflowStep.mockRejectedValue(dbError);

    // Act
    const res = await usecase.handler(300, [3], 666);

    // Assert
    expect(res).toEqual({
      success: false,
      error: {
        code: 'DB_ERROR',
        message: dbError,
      },
    });
  });
});
