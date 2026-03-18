import { BadRequestException } from '@nestjs/common';

import { UpdateTradeareaApproveUseCase } from './updateTradeareaApprove.usecase';

describe('UpdateTradeareaApproveUseCase', () => {
  const makeSut = (overrides?: {
    tradeareaRepository?: any;
    userRepository?: any;
    getCurrentWorkflowStepUseCase?: any;
    workflowApprovalUseCase?: any;
    workflowSendMailUseCase?: any;
    workflowRepository?: any;
  }) => {
    const tradeareaRepository =
      overrides?.tradeareaRepository ??
      ({
        findById: jest.fn(),
        update: jest.fn(),
        deleteTradearea: jest.fn(),
      } as any);

    const userRepository = overrides?.userRepository ?? ({} as any);

    const getCurrentWorkflowStepUseCase =
      overrides?.getCurrentWorkflowStepUseCase ??
      ({
        handler: jest.fn(),
      } as any);

    const workflowApprovalUseCase =
      overrides?.workflowApprovalUseCase ??
      ({
        handler: jest.fn(),
      } as any);

    const workflowSendMailUseCase =
      overrides?.workflowSendMailUseCase ??
      ({
        handler: jest.fn(),
      } as any);

    const workflowRepository =
      overrides?.workflowRepository ??
      ({
        updateWfTransaction: jest.fn(),
        createWfStepHistory: jest.fn(),
      } as any);

    const sut = new UpdateTradeareaApproveUseCase(
      tradeareaRepository,
      userRepository,
      getCurrentWorkflowStepUseCase,
      workflowApprovalUseCase,
      workflowSendMailUseCase,
      workflowRepository,
    );

    return {
      sut,
      tradeareaRepository,
      userRepository,
      getCurrentWorkflowStepUseCase,
      workflowApprovalUseCase,
      workflowSendMailUseCase,
      workflowRepository,
    };
  };

  const baseTradearea = {
    wfTransactionId: 'WF-1',
    tradeareaTypeName: 'trade_area',
    poiId: 1,
    zoneCode: 'Z',
    subzoneCode: 'SZ',
    storeCode: 'SC',
    storeName: 'SN',
  };

  it('throws BadRequestException when workflow approval returns success=false', async () => {
    const { sut, workflowApprovalUseCase } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        update: jest.fn(),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: false,
          error: { message: 'nope' },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn(),
      },
    });

    await expect(sut.handler(1, 'APPROVE' as any, 9, 'remark')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(workflowApprovalUseCase.handler).toHaveBeenCalledTimes(1);
  });

  it('updates status to SCHEDULED when current step is in lastStepApprove and action is APPROVE', async () => {
    const { sut, tradeareaRepository, getCurrentWorkflowStepUseCase } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        update: jest.fn().mockResolvedValue(undefined),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: { wfEmailDetailId: 123, wfStep: { wfStepNameTH: 'STEP' } },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 104 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn().mockResolvedValue(undefined),
      },
    });

    await expect(sut.handler(1, 'APPROVE' as any, 9, 'remark')).resolves.toBeUndefined();

    expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.update).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: expect.anything(),
      }),
    );
  });

  it('also updates parentId deletedAt when tradearea has parentId and step is in lastStepApprove', async () => {
    const tradeareaWithParent = {
      ...baseTradearea,
      parentId: 99,
      effectiveDate: '2025-01-01',
    };

    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(tradeareaWithParent),
        update: jest.fn().mockResolvedValue(undefined),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: { wfEmailDetailId: 123, wfStep: { wfStepNameTH: 'STEP' } },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 104 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn().mockResolvedValue(undefined),
      },
    });

    await expect(sut.handler(1, 'APPROVE' as any, 9, 'remark')).resolves.toBeUndefined();

    expect(tradeareaRepository.update).toHaveBeenCalledTimes(2);
    expect(tradeareaRepository.update).toHaveBeenNthCalledWith(
      1,
      1,
      expect.objectContaining({ status: expect.anything() }),
    );
    expect(tradeareaRepository.update).toHaveBeenNthCalledWith(
      2,
      99,
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
  });

  it('sets status to INACTIVE when action is NOT_APPROVE', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        update: jest.fn().mockResolvedValue(undefined),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: { wfEmailDetailId: 123, wfStep: { wfStepNameTH: 'STEP' } },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 104 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn().mockResolvedValue(undefined),
      },
    });

    await expect(
      sut.handler(1, 'NOT_APPROVE' as any, 9, 'remark'),
    ).resolves.toBeUndefined();

    expect(tradeareaRepository.update).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'INACTIVE' }),
    );
  });

  it('calls workflowRepository when NOT_APPROVE and tradearea has parentId', async () => {
    const tradeareaWithParent = { ...baseTradearea, parentId: 99, id: 1 };
    const parentTradearea = { ...baseTradearea, id: 99, wfTransactionId: 'WF-PARENT' };

    const { sut, tradeareaRepository, workflowRepository } = makeSut({
      tradeareaRepository: {
        findById: jest
          .fn()
          .mockResolvedValueOnce(tradeareaWithParent)
          .mockResolvedValueOnce(parentTradearea),
        update: jest.fn().mockResolvedValue(undefined),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: { wfEmailDetailId: 123, wfStep: { wfStepNameTH: 'STEP' } },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 104 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn().mockResolvedValue(undefined),
      },
      workflowRepository: {
        updateWfTransaction: jest.fn().mockResolvedValue(undefined),
        createWfStepHistory: jest.fn().mockResolvedValue(undefined),
      },
    });

    await expect(
      sut.handler(1, 'NOT_APPROVE' as any, 9, 'remark'),
    ).resolves.toBeUndefined();

    expect(tradeareaRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'INACTIVE' }),
    );
    expect(workflowRepository.updateWfTransaction).toHaveBeenCalledTimes(1);
    expect(workflowRepository.updateWfTransaction).toHaveBeenCalledWith(
      'WF-PARENT',
      expect.objectContaining({ wfStepId: 201, wfStatusId: 206 }),
    );
    expect(workflowRepository.createWfStepHistory).toHaveBeenCalledTimes(1);
    expect(workflowRepository.createWfStepHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        wfTransactionId: 'WF-PARENT',
        wfStepId: 201,
        wfStatusId: 206,
      }),
    );
  });

  it('deletes tradearea when current step is in lastStepDelete and action is APPROVE', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        update: jest.fn(),
        deleteTradearea: jest.fn().mockResolvedValue(undefined),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: { wfEmailDetailId: 123, wfStep: { wfStepNameTH: 'STEP' } },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 304 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn().mockResolvedValue(undefined),
      },
    });

    await expect(sut.handler(1, 'APPROVE' as any, 9, 'remark')).resolves.toBeUndefined();

    expect(tradeareaRepository.deleteTradearea).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.deleteTradearea).toHaveBeenCalledWith(1, 9);
  });

  it('throws BadRequestException when workflow route is missing (no route for email)', async () => {
    const { sut } = makeSut({
      tradeareaRepository: {
        findById: jest
          .fn()
          .mockResolvedValue({ ...baseTradearea, tradeareaTypeName: 'trade_area' }),
        update: jest.fn(),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: null,
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 999 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn(),
      },
    });

    await expect(sut.handler(1, 'APPROVE' as any, 9, 'remark')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not send email when wfEmailDetailId is missing', async () => {
    const { sut, workflowSendMailUseCase } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        update: jest.fn(),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: { wfStep: { wfStepNameTH: 'STEP' } },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 999 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn(),
      },
    });

    await expect(sut.handler(1, 'APPROVE' as any, 9, 'remark')).resolves.toBeUndefined();

    expect(workflowSendMailUseCase.handler).not.toHaveBeenCalled();
  });

  it('throws when sending mail fails (wfEmailDetailId exists)', async () => {
    const { sut, workflowSendMailUseCase } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        update: jest.fn(),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: { wfEmailDetailId: 1, wfStep: { wfStepNameTH: 'STEP' } },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 999 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn().mockRejectedValue(new Error('mail fail')),
      },
    });

    await expect(sut.handler(1, 'APPROVE' as any, 9, 'remark')).rejects.toThrow(
      'mail fail',
    );

    expect(workflowSendMailUseCase.handler).toHaveBeenCalledTimes(1);
  });

  it('throws BadRequestException for unsupported action', async () => {
    const { sut } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        update: jest.fn(),
        deleteTradearea: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: { wfEmailDetailId: 123, wfStep: { wfStepNameTH: 'STEP' } },
        }),
      },
      getCurrentWorkflowStepUseCase: {
        handler: jest.fn().mockResolvedValue({
          data: { wfStep: { wfStepId: 999 } },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn(),
      },
    });

    await expect(
      sut.handler(1, 'SEND_APPROVE' as any, 9, 'remark'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
