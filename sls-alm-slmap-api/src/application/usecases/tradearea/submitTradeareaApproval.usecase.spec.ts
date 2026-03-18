import { BadRequestException } from '@nestjs/common';

import { SubmitTradeareaApprovalUseCase } from './submitTradeareaApproval.usecase';

describe('SubmitTradeareaApprovalUseCase', () => {
  const makeSut = (overrides?: {
    tradeareaRepository?: any;
    userRepository?: any;
    getCurrentWorkflowStepUseCase?: any;
    workflowApprovalUseCase?: any;
    workflowSendMailUseCase?: any;
  }) => {
    const tradeareaRepository =
      overrides?.tradeareaRepository ??
      ({
        findById: jest.fn(),
        insertTradeareaHistory: jest.fn(),
      } as any);

    // Not used by handler(), but required by constructor
    const userRepository = overrides?.userRepository ?? ({} as any);

    // Not used by handler(), but required by constructor
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

    const sut = new SubmitTradeareaApprovalUseCase(
      tradeareaRepository,
      userRepository,
      getCurrentWorkflowStepUseCase,
      workflowApprovalUseCase,
      workflowSendMailUseCase,
    );

    return {
      sut,
      tradeareaRepository,
      userRepository,
      getCurrentWorkflowStepUseCase,
      workflowApprovalUseCase,
      workflowSendMailUseCase,
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

  it('throws BadRequestException when TradeareaId is missing (0)', async () => {
    const { sut, tradeareaRepository, workflowApprovalUseCase } = makeSut();

    await expect(sut.handler(0 as any, 9)).rejects.toBeInstanceOf(BadRequestException);

    expect(tradeareaRepository.findById).not.toHaveBeenCalled();
    expect(workflowApprovalUseCase.handler).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when TradeareaId is missing (undefined)', async () => {
    const { sut, tradeareaRepository, workflowApprovalUseCase } = makeSut();

    await expect(sut.handler(undefined as any, 9)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tradeareaRepository.findById).not.toHaveBeenCalled();
    expect(workflowApprovalUseCase.handler).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when workflow approval fails', async () => {
    const { sut, tradeareaRepository, workflowApprovalUseCase } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        insertTradeareaHistory: jest.fn(),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: false,
          error: { message: 'nope' },
        }),
      },
    });

    await expect(sut.handler(1, 9)).rejects.toBeInstanceOf(BadRequestException);

    expect(tradeareaRepository.findById).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findById).toHaveBeenCalledWith(1);

    expect(workflowApprovalUseCase.handler).toHaveBeenCalledTimes(1);
    expect(workflowApprovalUseCase.handler).toHaveBeenCalledWith(
      expect.objectContaining({
        refId: 1,
        wfTransactionId: 'WF-1',
        approvalAction: 'SEND_APPROVE',
        userId: 9,
      }),
    );

    expect(tradeareaRepository.insertTradeareaHistory).not.toHaveBeenCalled();
  });

  it('inserts history and sends email when route.wfEmailDetailId exists', async () => {
    const { sut, tradeareaRepository, workflowSendMailUseCase } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        insertTradeareaHistory: jest.fn().mockResolvedValue(undefined),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: {
            wfEmailDetailId: 123,
            wfStep: { wfStepNameTH: 'STEP_TH' },
          },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn().mockResolvedValue(undefined),
      },
    });

    await expect(sut.handler(1, 9)).resolves.toBeUndefined();

    expect(tradeareaRepository.insertTradeareaHistory).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.insertTradeareaHistory).toHaveBeenCalledWith(
      1,
      '9',
      'SUBMITTED',
      'CREATE',
    );

    expect(workflowSendMailUseCase.handler).toHaveBeenCalledTimes(1);
    expect(workflowSendMailUseCase.handler).toHaveBeenCalledWith(
      expect.objectContaining({
        wfTransactionId: 'WF-1',
        emailDetailId: 123,
        approvalAction: 'SEND_APPROVE',
        userId: 9,
        templateData: expect.objectContaining({
          LAYER_NAME: 'Trade Area',
          STEP_NAME: 'STEP_TH',
          POI_ID: 1,
          ZONE: 'Z',
          SUB_ZONE: 'SZ',
          STORE_CODE: 'SC',
          STORE_NAME: 'SN',
          TRADE_AREA_ID: 1,
        }),
      }),
    );
  });

  it('does not send email when route.wfEmailDetailId is missing', async () => {
    const { sut, tradeareaRepository, workflowSendMailUseCase } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        insertTradeareaHistory: jest.fn().mockResolvedValue(undefined),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: {
            wfStep: { wfStepNameTH: 'STEP_TH' },
          },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn(),
      },
    });

    await expect(sut.handler(1, 9)).resolves.toBeUndefined();

    expect(tradeareaRepository.insertTradeareaHistory).toHaveBeenCalledTimes(1);
    expect(workflowSendMailUseCase.handler).not.toHaveBeenCalled();
  });

  it('throws when send mail handler throws (wfEmailDetailId exists)', async () => {
    const { sut, workflowSendMailUseCase } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(baseTradearea),
        insertTradeareaHistory: jest.fn().mockResolvedValue(undefined),
      },
      workflowApprovalUseCase: {
        handler: jest.fn().mockResolvedValue({
          success: true,
          route: {
            wfEmailDetailId: 123,
            wfStep: { wfStepNameTH: 'STEP_TH' },
          },
        }),
      },
      workflowSendMailUseCase: {
        handler: jest.fn().mockRejectedValue(new Error('mail fail')),
      },
    });

    await expect(sut.handler(1, 9)).rejects.toThrow('mail fail');
    expect(workflowSendMailUseCase.handler).toHaveBeenCalledTimes(1);
  });
});
