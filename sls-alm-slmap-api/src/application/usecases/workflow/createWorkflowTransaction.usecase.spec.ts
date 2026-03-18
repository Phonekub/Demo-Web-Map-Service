import { CreateWorkflowTransactionUseCase } from './createWorkflowTransaction.usecase';

describe('CreateWorkflowTransactionUseCase (3A)', () => {
  let mockRepo: any;
  let usecase: CreateWorkflowTransactionUseCase;

  const userId = 42;

  beforeEach(() => {
    mockRepo = {
      checkWfTransactionExists: jest.fn(),
      getWorkflowById: jest.fn(),
      getWorkflowStepById: jest.fn(),
      checkUserPermission: jest.fn(),
      createWfTransaction: jest.fn(),
      createWfStepHistory: jest.fn(),
    };

    usecase = new CreateWorkflowTransactionUseCase(mockRepo);
  });

  it('Arrange/Act/Assert - should return INVALID_INPUT when inputs are missing', async () => {
    // Arrange

    // Act
    const res1 = await usecase.handler(undefined as any, 1, userId);
    const res2 = await usecase.handler(1, undefined as any, userId);
    const res3 = await usecase.handler(1, 1, undefined as any);

    // Assert
    const expected = {
      success: false,
      error: { code: 'INVALID_INPUT', message: 'ข้อมูลไม่ครบถ้วน' },
    };
    expect(res1).toEqual(expected);
    expect(res2).toEqual(expected);
    expect(res3).toEqual(expected);
  });

  it('Arrange/Act/Assert - should return ALREADY_EXISTS when transaction already exists', async () => {
    // Arrange
    mockRepo.checkWfTransactionExists.mockResolvedValue(true);

    // Act
    const res = await usecase.handler(10, 100, userId);

    // Assert
    expect(mockRepo.checkWfTransactionExists).toHaveBeenCalledWith(10, 100);
    expect(res).toEqual({
      success: false,
      error: {
        code: 'ALREADY_EXISTS',
        message: 'Workflow transaction นี้มีอยู่แล้ว ไม่สามารถสร้างซ้ำได้',
      },
    });
  });

  it('Arrange/Act/Assert - should return INVALID_WF when workflow not found', async () => {
    // Arrange
    mockRepo.checkWfTransactionExists.mockResolvedValue(false);
    mockRepo.getWorkflowById.mockResolvedValue(null);

    // Act
    const res = await usecase.handler(10, 100, userId);

    // Assert
    expect(mockRepo.getWorkflowById).toHaveBeenCalledWith(10);
    expect(res).toEqual({
      success: false,
      error: { code: 'INVALID_WF', message: 'ไม่สามารถสร้าง Workflow ได้' },
    });
  });

  it('Arrange/Act/Assert - should return INVALID_WF when first step not found', async () => {
    // Arrange
    const workflow = { firstStepId: 11, firstStatusId: 1, firstActionId: 2 };
    mockRepo.checkWfTransactionExists.mockResolvedValue(false);
    mockRepo.getWorkflowById.mockResolvedValue(workflow);
    mockRepo.getWorkflowStepById.mockResolvedValue(null);

    // Act
    const res = await usecase.handler(10, 100, userId);

    // Assert
    expect(mockRepo.getWorkflowById).toHaveBeenCalledWith(10);
    expect(mockRepo.getWorkflowStepById).toHaveBeenCalledWith(11);
    expect(res).toEqual({
      success: false,
      error: { code: 'INVALID_WF', message: 'ไม่สามารถสร้าง Workflow ได้' },
    });
  });

  it('Arrange/Act/Assert - should return PERMISSION_DENIED when user has no permission', async () => {
    // Arrange
    const workflow = { firstStepId: 11, firstStatusId: 1, firstActionId: 2 };
    const firstStep = {
      id: 11,
      wfId: 1,
      wfStepName: 'S',
      stepOwnerType: 'USER',
      stepOwnerRole: 'role_x',
      stepOwnerUser: null,
      isActive: 'Y',
    };
    mockRepo.checkWfTransactionExists.mockResolvedValue(false);
    mockRepo.getWorkflowById.mockResolvedValue(workflow);
    mockRepo.getWorkflowStepById.mockResolvedValue(firstStep);
    mockRepo.checkUserPermission.mockResolvedValue(false);

    // Act
    const res = await usecase.handler(10, 100, userId);

    // Assert
    expect(mockRepo.checkUserPermission).toHaveBeenCalledWith(
      userId,
      firstStep.stepOwnerRole,
    );
    expect(res).toEqual({
      success: false,
      error: { code: 'PERMISSION_DENIED', message: 'ไม่มีสิทธิ์ดำเนินการ' },
    });
  });

  it('Arrange/Act/Assert - should create transaction and history when owner type is USER', async () => {
    // Arrange
    const workflow = { firstStepId: 11, firstStatusId: 1, firstActionId: 2 };
    const firstStep = {
      id: 11,
      wfId: 1,
      wfStepName: 'S',
      stepOwnerType: 'USER',
      stepOwnerRole: 'role_x',
      stepOwnerUser: null,
      isActive: 'Y',
    };
    mockRepo.checkWfTransactionExists.mockResolvedValue(false);
    mockRepo.getWorkflowById.mockResolvedValue(workflow);
    mockRepo.getWorkflowStepById.mockResolvedValue(firstStep);
    mockRepo.checkUserPermission.mockResolvedValue(true);
    mockRepo.createWfTransaction.mockResolvedValue(555);
    mockRepo.createWfStepHistory.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler(20, 200, userId);

    // Assert
    expect(mockRepo.createWfTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        wfId: 20,
        refId: 200,
        wfStepId: workflow.firstStepId,
        wfStatusId: workflow.firstStatusId,
        approveBy: userId.toString(),
        approveType: firstStep.stepOwnerType,
        createBy: userId,
        updateBy: userId,
      }),
    );

    expect(mockRepo.createWfStepHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        wfTransactionId: 555,
        refId: 200,
        wfStepId: workflow.firstStepId,
        wfStatusId: workflow.firstStatusId,
        wfActionId: workflow.firstActionId,
      }),
    );

    expect(res).toEqual({ success: true, data: { wfTransactionId: 555 } });
  });

  it('Arrange/Act/Assert - should set approveBy to role when owner type is ROLE', async () => {
    // Arrange
    const workflow = { firstStepId: 11, firstStatusId: 1, firstActionId: 2 };
    const firstStep = {
      id: 11,
      wfId: 1,
      wfStepName: 'S',
      stepOwnerType: 'ROLE',
      stepOwnerRole: 'ROLE_X',
      stepOwnerUser: null,
      isActive: 'Y',
    };
    mockRepo.checkWfTransactionExists.mockResolvedValue(false);
    mockRepo.getWorkflowById.mockResolvedValue(workflow);
    mockRepo.getWorkflowStepById.mockResolvedValue(firstStep);
    mockRepo.checkUserPermission.mockResolvedValue(true);
    mockRepo.createWfTransaction.mockResolvedValue(777);
    mockRepo.createWfStepHistory.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler(30, 300, userId);

    // Assert
    expect(mockRepo.createWfTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        approveBy: firstStep.stepOwnerRole,
        approveType: firstStep.stepOwnerType,
      }),
    );

    expect(res).toEqual({ success: true, data: { wfTransactionId: 777 } });
  });

  it('Arrange/Act/Assert - should return DB_ERROR when repository throws', async () => {
    // Arrange
    mockRepo.checkWfTransactionExists.mockRejectedValue(new Error('db'));

    // Act
    const res = await usecase.handler(40, 400, userId);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'DB_ERROR', message: 'ไม่สามารถสร้างรายการได้' },
    });
  });
});
