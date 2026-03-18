import { WorkflowApprovalUseCase } from './workflowApproval.usecase';

describe('WorkflowApprovalUseCase (3A)', () => {
  let mockRepo: any;
  let mockGetCurrent: any;
  let mockSendMail: any;
  let usecase: WorkflowApprovalUseCase;

  const userId = 7;

  beforeEach(() => {
    mockRepo = {
      getWfIdByTransactionId: jest.fn(),
      getCurrentWorkflowStep: jest.fn(),
      getRouteByStepActionAndParameter: jest.fn(),
      getWorkflowStepById: jest.fn(),
      findUserIdByStepOwnerRole: jest.fn(),
      filterUserIdsByZone: jest.fn(),
      updateWfTransaction: jest.fn(),
      createWfStepHistory: jest.fn(),
    };

    mockGetCurrent = { handler: jest.fn() };
    mockSendMail = { handler: jest.fn() };

    usecase = new WorkflowApprovalUseCase(mockRepo, mockGetCurrent, mockSendMail);
  });

  it('Arrange/Act/Assert - should return INVALID_INPUT when payload missing', async () => {
    // Arrange
    // Act
    const res = await usecase.handler({} as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'ข้อมูลไม่ครบถ้วน' },
    });
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when transaction not found', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue(null);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'A',
      userId,
    } as any);

    // Assert
    expect(mockRepo.getWfIdByTransactionId).toHaveBeenCalledWith(2);
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูล workflow transaction' },
    });
  });

  it('Arrange/Act/Assert - should propagate error when getCurrentWorkflowStep fails', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: false,
      error: { code: 'SOME', message: 'err' },
    });

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'A',
      userId,
    } as any);

    // Assert
    expect(mockGetCurrent.handler).toHaveBeenCalledWith(1, [1], userId);
    expect(res).toEqual({ success: false, error: { code: 'SOME', message: 'err' } });
  });

  it('Arrange/Act/Assert - should return NOT_FOUND when full current data missing', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'A' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue(null);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'A',
      userId,
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูล' },
    });
  });

  it('Arrange/Act/Assert - should return TRANSACTION_MISMATCH when transaction ids differ', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 99,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'A' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '1' });

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'A',
      userId,
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: {
        code: 'TRANSACTION_MISMATCH',
        message: 'ไม่สามารถดำเนินการได้ เนื่องจาก Workflow ไม่ตรงกัน',
      },
    });
  });

  it('Arrange/Act/Assert - should return INVALID_ACTION when action not available', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'B' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '1' });

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'A',
      userId,
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: {
        code: 'INVALID_ACTION',
        message: 'ไม่สามารถดำเนินการได้ ไม่พบ Action ที่ระบุ',
      },
    });
  });

  it('Arrange/Act/Assert - should perform successful approval and send email (USER stay in same step)', async () => {
    // Arrange
    const currentData = {
      wfTransactionId: 2,
      wfStep: { wfStepId: 10 },
      wfStatus: { wfStatusId: 1 },
      canAction: true,
      availableActions: [{ actionCode: 'APP' }],
    };
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({ success: true, data: currentData });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });

    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 10,
      wfToStatusId: 5,
      wfActionId: 99,
      wfEmailDetailId: 55,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'USER',
      stepOwnerRole: 'role1',
      stepOwnerUser: null,
    });
    mockRepo.findUserIdByStepOwnerRole.mockResolvedValue('444');

    mockRepo.updateWfTransaction.mockResolvedValue(undefined);
    mockRepo.createWfStepHistory.mockResolvedValue(undefined);
    mockSendMail.handler.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
      remark: 'ok',
    } as any);

    // Assert
    expect(mockRepo.getRouteByStepActionAndParameter).toHaveBeenCalledWith(
      10,
      'APP',
      undefined,
    );
    expect(mockRepo.updateWfTransaction).toHaveBeenCalled();
    expect(mockRepo.createWfStepHistory).toHaveBeenCalledWith(
      expect.objectContaining({ wfTransactionId: 2, wfActionId: 99 }),
    );
    expect(res).toEqual({ success: true, route: expect.any(Object), data: currentData });
  });

  it('Arrange/Act/Assert - should handle sendMail failure gracefully and still succeed', async () => {
    // Arrange
    const currentData = {
      wfTransactionId: 2,
      wfStep: { wfStepId: 10 },
      wfStatus: { wfStatusId: 1 },
      canAction: true,
      availableActions: [{ actionCode: 'APP' }],
    };
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({ success: true, data: currentData });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });

    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 11,
      wfToStatusId: 5,
      wfActionId: 99,
      wfEmailDetailId: 55,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'ROLE',
      stepOwnerRole: 'ROLE_X',
      stepOwnerUser: null,
    });

    mockRepo.updateWfTransaction.mockResolvedValue(undefined);
    mockRepo.createWfStepHistory.mockResolvedValue(undefined);
    mockSendMail.handler.mockRejectedValue(new Error('email fail'));

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
      remark: 'ok',
    } as any);

    // Assert
    expect(mockRepo.updateWfTransaction).toHaveBeenCalled();
    expect(mockRepo.createWfStepHistory).toHaveBeenCalled();
    expect(res).toEqual({ success: true, route: expect.any(Object), data: currentData });
  });

  it('Arrange/Act/Assert - should return PERMISSION_DENIED when canAction is false', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: false,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'PERMISSION_DENIED', message: 'ไม่มีสิทธิ์ดำเนินการ' },
    });
  });

  it('Arrange/Act/Assert - should return INVALID_ACTION when route is null even if action available', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });
    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue(null);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(mockRepo.getRouteByStepActionAndParameter).toHaveBeenCalledWith(
      10,
      'APP',
      undefined,
    );
    expect(res).toEqual({
      success: false,
      error: { code: 'INVALID_ACTION', message: 'ไม่สามารถดำเนินการได้ ไม่พบ Route' },
    });
  });

  it('Arrange/Act/Assert - should return DB_ERROR when nextStep is not found', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });
    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 99,
      wfToStatusId: 5,
      wfActionId: 88,
      wfEmailDetailId: 0,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue(null);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(mockRepo.getWorkflowStepById).toHaveBeenCalledWith(99);
    expect(res).toEqual({
      success: false,
      error: { code: 'DB_ERROR', message: 'ไม่สามารถดำเนินการได้ ไม่พบขั้นตอนถัดไป' },
    });
  });

  it('Arrange/Act/Assert - should return DB_ERROR when nextStep is USER and no approver found (not stay in same step)', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });
    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 11,
      wfToStatusId: 5,
      wfActionId: 88,
      wfEmailDetailId: 0,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'USER',
      stepOwnerRole: 'ROLE_X',
      stepOwnerUser: null,
    });
    mockRepo.findUserIdByStepOwnerRole.mockResolvedValue(null);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
    } as any);

    // Assert
    expect(mockRepo.findUserIdByStepOwnerRole).toHaveBeenCalledWith('ROLE_X', undefined, undefined);
    expect(res).toEqual({
      success: false,
      error: { code: 'DB_ERROR', message: 'ไม่พบผู้อนุมัติ' },
    });
  });

  it('Arrange/Act/Assert - should set approveBy to found userId when nextStep USER and not stay-in-step', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });
    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 11,
      wfToStatusId: 5,
      wfActionId: 88,
      wfEmailDetailId: 0,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'USER',
      stepOwnerRole: 'ROLE_X',
      stepOwnerUser: null,
    });
    mockRepo.findUserIdByStepOwnerRole.mockResolvedValue('999');

    mockRepo.updateWfTransaction.mockResolvedValue(undefined);
    mockRepo.createWfStepHistory.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
      remark: 'ok',
    } as any);

    // Assert
    expect(mockRepo.findUserIdByStepOwnerRole).toHaveBeenCalledWith('ROLE_X', undefined, undefined);
    expect(mockRepo.updateWfTransaction).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ approveBy: '999' }),
    );
    expect(res).toEqual({
      success: true,
      route: expect.any(Object),
      data: expect.any(Object),
    });
  });

  it('Arrange/Act/Assert - should return DB_ERROR when updateWfTransaction throws', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });
    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 11,
      wfToStatusId: 5,
      wfActionId: 88,
      wfEmailDetailId: 0,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'ROLE',
      stepOwnerRole: 'ROLE_X',
      stepOwnerUser: null,
    });

    mockRepo.updateWfTransaction.mockRejectedValue(new Error('fail update'));

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
      remark: 'ok',
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'DB_ERROR', message: 'ไม่สามารถดำเนินการได้ fail update' },
    });
  });

  it('Arrange/Act/Assert - should handle workflow with wfParameter', async () => {
    // Arrange
    const currentData = {
      wfTransactionId: 2,
      wfStep: { wfStepId: 10 },
      wfStatus: { wfStatusId: 1 },
      canAction: true,
      availableActions: [{ actionCode: 'APP' }],
    };
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({ success: true, data: currentData });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });

    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 11,
      wfToStatusId: 5,
      wfActionId: 99,
      wfEmailDetailId: 0,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'ROLE',
      stepOwnerRole: 'ADMIN',
      stepOwnerUser: null,
    });

    mockRepo.updateWfTransaction.mockResolvedValue(undefined);
    mockRepo.createWfStepHistory.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
      wfParameter: { zone_type: 'A' },
    } as any);

    // Assert
    expect(mockRepo.getRouteByStepActionAndParameter).toHaveBeenCalledWith(10, 'APP', {
      zone_type: 'A',
    });
    expect(res).toEqual({ success: true, route: expect.any(Object), data: currentData });
  });

  // ─── stepOwnerUser zone-filter tests ────────────────────────────────────────

  it('Arrange/Act/Assert - should filter stepOwnerUser by zone and set comma-joined approveBy', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });
    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 11,
      wfToStatusId: 5,
      wfActionId: 88,
      wfEmailDetailId: 0,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'USER',
      stepOwnerRole: 'ROLE_X',
      stepOwnerUser: '1,2,3',
    });
    mockRepo.filterUserIdsByZone.mockResolvedValue([1, 3]);
    mockRepo.updateWfTransaction.mockResolvedValue(undefined);
    mockRepo.createWfStepHistory.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
      condition: { zone: 'ZN01' },
    } as any);

    // Assert
    expect(mockRepo.filterUserIdsByZone).toHaveBeenCalledWith([1, 2, 3], 'ZN01', undefined);
    expect(mockRepo.updateWfTransaction).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ approveBy: '1,3' }),
    );
    expect(res).toEqual({ success: true, route: expect.any(Object), data: expect.any(Object) });
  });

  it('Arrange/Act/Assert - should return DB_ERROR when zone filter returns empty list from stepOwnerUser', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });
    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 11,
      wfToStatusId: 5,
      wfActionId: 88,
      wfEmailDetailId: 0,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'USER',
      stepOwnerRole: 'ROLE_X',
      stepOwnerUser: '1,2,3',
    });
    mockRepo.filterUserIdsByZone.mockResolvedValue([]);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
      condition: { zone: 'ZN99' },
    } as any);

    // Assert
    expect(res).toEqual({
      success: false,
      error: { code: 'DB_ERROR', message: 'ไม่พบผู้อนุมัติที่มีสิทธิ์ในโซนที่กำหนด' },
    });
  });

  it('Arrange/Act/Assert - should pass zone and subZone to findUserIdByStepOwnerRole when no stepOwnerUser', async () => {
    // Arrange
    mockRepo.getWfIdByTransactionId.mockResolvedValue({ wfId: 1, refId: 1 });
    mockGetCurrent.handler.mockResolvedValue({
      success: true,
      data: {
        wfTransactionId: 2,
        wfStep: { wfStepId: 10 },
        wfStatus: { wfStatusId: 1 },
        canAction: true,
        availableActions: [{ actionCode: 'APP' }],
      },
    });
    mockRepo.getCurrentWorkflowStep.mockResolvedValue({ approveBy: '123' });
    mockRepo.getRouteByStepActionAndParameter.mockResolvedValue({
      wfToStepId: 11,
      wfToStatusId: 5,
      wfActionId: 88,
      wfEmailDetailId: 0,
    });
    mockRepo.getWorkflowStepById.mockResolvedValue({
      stepOwnerType: 'USER',
      stepOwnerRole: 'ROLE_X',
      stepOwnerUser: null,
    });
    mockRepo.findUserIdByStepOwnerRole.mockResolvedValue('42');
    mockRepo.updateWfTransaction.mockResolvedValue(undefined);
    mockRepo.createWfStepHistory.mockResolvedValue(undefined);

    // Act
    const res = await usecase.handler({
      refId: 1,
      wfTransactionId: 2,
      approvalAction: 'APP',
      userId,
      condition: { zone: 'ZN01', subZone: 'SZ01' },
    } as any);

    // Assert
    expect(mockRepo.findUserIdByStepOwnerRole).toHaveBeenCalledWith('ROLE_X', 'ZN01', 'SZ01');
    expect(mockRepo.updateWfTransaction).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ approveBy: '42' }),
    );
    expect(res).toEqual({ success: true, route: expect.any(Object), data: expect.any(Object) });
  });
});
