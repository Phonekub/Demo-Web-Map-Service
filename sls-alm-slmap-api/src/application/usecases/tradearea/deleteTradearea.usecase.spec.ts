import { BadRequestException } from '@nestjs/common';

import { DeleteTradeareaUseCase } from './deleteTradearea.usecase';

describe('DeleteTradeareaUseCase', () => {
  const makeSut = (overrides?: {
    tradeareaRepository?: any;
    getCurrentWorkflowStepUseCase?: any;
    workflowApprovalUseCase?: any;
    workflowSendMailUseCase?: any;
  }) => {
    const tradeareaRepository =
      overrides?.tradeareaRepository ??
      ({
        findById: jest.fn(),
        deleteTradearea: jest.fn(),
      } as any);

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

    const sut = new DeleteTradeareaUseCase(
      tradeareaRepository,
      getCurrentWorkflowStepUseCase,
      workflowApprovalUseCase,
      workflowSendMailUseCase,
    );

    return {
      sut,
      tradeareaRepository,
      getCurrentWorkflowStepUseCase,
      workflowApprovalUseCase,
      workflowSendMailUseCase,
    };
  };

  it('throws BadRequestException when tradearea not found', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(sut.handler(1, 9)).rejects.toBeInstanceOf(BadRequestException);
    expect(tradeareaRepository.findById).toHaveBeenCalledWith(1);
  });

  it('does nothing when status is not mapped (no draft/active/scheduled)', async () => {
    const {
      sut,
      tradeareaRepository,
      getCurrentWorkflowStepUseCase,
      workflowApprovalUseCase,
    } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue({ id: 1, status: 'UNKNOWN' }),
        deleteTradearea: jest.fn(),
      },
    });

    await expect(sut.handler(1, 9)).resolves.toBeUndefined();

    expect(tradeareaRepository.deleteTradearea).not.toHaveBeenCalled();
    expect(getCurrentWorkflowStepUseCase.handler).not.toHaveBeenCalled();
    expect(workflowApprovalUseCase.handler).not.toHaveBeenCalled();
  });

  describe('draft status', () => {
    it('throws BadRequestException when current step is not allowed', async () => {
      const {
        sut,
        tradeareaRepository,
        getCurrentWorkflowStepUseCase,
        workflowApprovalUseCase,
      } = makeSut({
        tradeareaRepository: {
          findById: jest.fn().mockResolvedValue({ id: 1, status: 'draft' }),
          deleteTradearea: jest.fn(),
        },
        getCurrentWorkflowStepUseCase: {
          handler: jest.fn().mockResolvedValue({
            data: { wfStep: { wfStepId: 999 } },
          }),
        },
      });

      await expect(sut.handler(1, 9)).rejects.toBeInstanceOf(BadRequestException);

      expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalled();
      expect(tradeareaRepository.deleteTradearea).not.toHaveBeenCalled();
      expect(workflowApprovalUseCase.handler).not.toHaveBeenCalled();
    });

    it('deletes tradearea when current step is allowed', async () => {
      const {
        sut,
        tradeareaRepository,
        getCurrentWorkflowStepUseCase,
        workflowApprovalUseCase,
      } = makeSut({
        tradeareaRepository: {
          findById: jest.fn().mockResolvedValue({ id: 1, status: 'draft' }),
          deleteTradearea: jest.fn().mockResolvedValue(undefined),
        },
        getCurrentWorkflowStepUseCase: {
          handler: jest.fn().mockResolvedValue({
            data: { wfStep: { wfStepId: 101 } },
          }),
        },
      });

      await expect(sut.handler(1, 9)).resolves.toBeUndefined();

      expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalled();
      expect(tradeareaRepository.deleteTradearea).toHaveBeenCalledWith(1, 9);
      expect(workflowApprovalUseCase.handler).not.toHaveBeenCalled();
    });
  });

  describe('active status', () => {
    const baseTradearea = {
      id: 1,
      status: 'active',
      wfTransactionId: 'WF',
      tradeareaTypeName: 'trade_area',
      poiId: 1,
      zoneCode: 'Z',
      subzoneCode: 'SZ',
      storeCode: 'SC',
      storeName: 'SN',
    };

    it('throws BadRequestException when workflow approval fails', async () => {
      const { sut, workflowApprovalUseCase, workflowSendMailUseCase } = makeSut({
        tradeareaRepository: {
          findById: jest.fn().mockResolvedValue(baseTradearea),
        },
        workflowApprovalUseCase: {
          handler: jest.fn().mockResolvedValue({
            success: false,
            error: { message: 'wf failed' },
          }),
        },
      });

      await expect(sut.handler(1, 9)).rejects.toBeInstanceOf(BadRequestException);
      expect(workflowApprovalUseCase.handler).toHaveBeenCalled();
      expect(workflowSendMailUseCase.handler).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when no route found', async () => {
      const { sut, workflowApprovalUseCase, workflowSendMailUseCase } = makeSut({
        tradeareaRepository: {
          findById: jest.fn().mockResolvedValue(baseTradearea),
        },
        workflowApprovalUseCase: {
          handler: jest.fn().mockResolvedValue({
            success: true,
            route: null,
          }),
        },
      });

      await expect(sut.handler(1, 9)).rejects.toBeInstanceOf(BadRequestException);
      expect(workflowApprovalUseCase.handler).toHaveBeenCalled();
      expect(workflowSendMailUseCase.handler).not.toHaveBeenCalled();
    });

    it('sends email when wfEmailDetailId exists', async () => {
      const { sut, workflowSendMailUseCase } = makeSut({
        tradeareaRepository: {
          findById: jest.fn().mockResolvedValue(baseTradearea),
        },
        workflowApprovalUseCase: {
          handler: jest.fn().mockResolvedValue({
            success: true,
            route: { wfEmailDetailId: 1, wfStep: { wfStepNameTH: 'STEP' } },
          }),
        },
        workflowSendMailUseCase: {
          handler: jest.fn().mockResolvedValue(undefined),
        },
      });

      await expect(sut.handler(1, 9)).resolves.toBeUndefined();
      expect(workflowSendMailUseCase.handler).toHaveBeenCalled();
    });

    it('does not send email when wfEmailDetailId is missing', async () => {
      const { sut, workflowSendMailUseCase } = makeSut({
        tradeareaRepository: {
          findById: jest.fn().mockResolvedValue(baseTradearea),
        },
        workflowApprovalUseCase: {
          handler: jest.fn().mockResolvedValue({
            success: true,
            route: { wfStep: { wfStepNameTH: 'STEP' } },
          }),
        },
      });

      await expect(sut.handler(1, 9)).resolves.toBeUndefined();
      expect(workflowSendMailUseCase.handler).not.toHaveBeenCalled();
    });

    it('throws when email sending throws', async () => {
      const { sut, workflowSendMailUseCase } = makeSut({
        tradeareaRepository: {
          findById: jest.fn().mockResolvedValue(baseTradearea),
        },
        workflowApprovalUseCase: {
          handler: jest.fn().mockResolvedValue({
            success: true,
            route: { wfEmailDetailId: 1, wfStep: { wfStepNameTH: 'STEP' } },
          }),
        },
        workflowSendMailUseCase: {
          handler: jest.fn().mockRejectedValue(new Error('mail fail')),
        },
      });

      await expect(sut.handler(1, 9)).rejects.toThrow('mail fail');
      expect(workflowSendMailUseCase.handler).toHaveBeenCalled();
    });
  });

  describe('scheduled status', () => {
    // scheduled shares the same path as "active" in the implementation (calls isActive with DELETE)
    it('follows active-flow and reaches email send when wfEmailDetailId exists', async () => {
      const tradearea = {
        id: 1,
        status: 'scheduled',
        wfTransactionId: 'WF',
        tradeareaTypeName: 'trade_area',
        poiId: 1,
        zoneCode: 'Z',
        subzoneCode: 'SZ',
        storeCode: 'SC',
        storeName: 'SN',
      };

      const { sut, workflowApprovalUseCase, workflowSendMailUseCase } = makeSut({
        tradeareaRepository: {
          findById: jest.fn().mockResolvedValue(tradearea),
        },
        workflowApprovalUseCase: {
          handler: jest.fn().mockResolvedValue({
            success: true,
            route: { wfEmailDetailId: 1, wfStep: { wfStepNameTH: 'STEP' } },
          }),
        },
        workflowSendMailUseCase: {
          handler: jest.fn().mockResolvedValue(undefined),
        },
      });

      await expect(sut.handler(1, 9)).resolves.toBeUndefined();
      expect(workflowApprovalUseCase.handler).toHaveBeenCalled();
      expect(workflowSendMailUseCase.handler).toHaveBeenCalled();
    });
  });
});
