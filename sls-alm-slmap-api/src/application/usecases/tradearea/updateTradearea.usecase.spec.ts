import { NotFoundException } from '@nestjs/common';

import { UpdateTradeareaUseCase } from './updateTradearea.usecase';

describe('UpdateTradeareaUseCase', () => {
  const makeSut = (overrides?: { tradeareaRepository?: any }) => {
    const tradeareaRepository =
      overrides?.tradeareaRepository ??
      ({
        findById: jest.fn(),
        update: jest.fn(),
      } as any);

    // These dependencies exist in the constructor but are not used by handler()
    const getCurrentWorkflowStepUseCase = { handler: jest.fn() } as any;
    const workflowApprovalUseCase = { handler: jest.fn() } as any;
    const workflowSendMailUseCase = { handler: jest.fn() } as any;

    const sut = new UpdateTradeareaUseCase(
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

  it('throws NotFoundException when trade area does not exist', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    });

    await expect(sut.handler({ id: 123 } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(tradeareaRepository.findById).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findById).toHaveBeenCalledWith(123);
    expect(tradeareaRepository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when update returns falsy (failed to update)', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue({ id: 123 }),
        update: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(
      sut.handler({
        id: 123,
        zoneCode: 'bkk',
        shape: { type: 'Polygon', coordinates: [[[100, 13]]] },
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(tradeareaRepository.findById).toHaveBeenCalledWith(123);

    expect(tradeareaRepository.update).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        zoneCode: 'BKK',
      }),
    );
  });

  it('updates tradearea with transformed fields and returns updated tradearea', async () => {
    const updated = { id: 123, zoneCode: 'BKK' };

    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue({ id: 123 }),
        update: jest.fn().mockResolvedValue(updated),
      },
    });

    const payload = {
      id: 123,
      refStoreCode: 'REF',
      zoneCode: 'bkk',
      subzoneCode: '01',
      status: 'draft',
      effectiveDate: '2026-01-01',
      shape: { type: 'Polygon', coordinates: [[[100, 13]]] },
      storeName: 'Store',
      areaColor: '#fff',
      comment: 'c',
      warning: 'w',
      updateUser: 'john',
    };

    const result = await sut.handler(payload as any);

    expect(tradeareaRepository.findById).toHaveBeenCalledWith(123);

    expect(tradeareaRepository.update).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.update).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        refStoreCode: payload.refStoreCode,
        zoneCode: 'BKK',
        subzoneCode: payload.subzoneCode,
        status: payload.status,
        effectiveDate: '2026-01-01',
        shape: payload.shape,
        storeName: payload.storeName,
        areaColor: payload.areaColor,
        comment: payload.comment,
        warning: payload.warning,
        updateUser: payload.updateUser,
      }),
    );

    expect(result).toBe(updated);
  });

  it('passes effectiveDate as undefined when not provided and defaults updateUser to SYSTEM', async () => {
    const updated = { id: 123 };

    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue({ id: 123 }),
        update: jest.fn().mockResolvedValue(updated),
      },
    });

    const payload = {
      id: 123,
      zoneCode: 'bkk',
      effectiveDate: undefined,
      updateUser: undefined,
      shape: { type: 'Polygon', coordinates: [[[100, 13]]] },
    };

    await sut.handler(payload as any);

    expect(tradeareaRepository.update).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        zoneCode: 'BKK',
        effectiveDate: undefined,
        updateUser: 'SYSTEM',
      }),
    );
  });
});
