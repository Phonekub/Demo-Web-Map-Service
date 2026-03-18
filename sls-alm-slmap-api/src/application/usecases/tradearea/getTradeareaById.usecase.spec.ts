import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GetTradeareaByIdUseCase } from './getTradeareaById.usecase';

describe('GetTradeareaByIdUseCase', () => {
  const makeSut = (overrides?: { tradeareaRepository?: any }) => {
    const tradeareaRepository =
      overrides?.tradeareaRepository ??
      ({
        findById: jest.fn(),
      } as any);

    const sut = new GetTradeareaByIdUseCase(tradeareaRepository);

    return { sut, tradeareaRepository };
  };

  it('throws BadRequestException when id is missing/invalid', async () => {
    const { sut, tradeareaRepository } = makeSut();

    await expect(sut.handler(0 as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(sut.handler(-1 as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(sut.handler(undefined as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tradeareaRepository.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when tradearea is not found', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(sut.handler(123)).rejects.toBeInstanceOf(NotFoundException);
    expect(tradeareaRepository.findById).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findById).toHaveBeenCalledWith(123);
  });

  it('returns tradearea when found', async () => {
    const tradearea = { id: 123, zoneCode: 'BKK' };

    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockResolvedValue(tradearea),
      },
    });

    await expect(sut.handler(123)).resolves.toBe(tradearea);
    expect(tradeareaRepository.findById).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findById).toHaveBeenCalledWith(123);
  });

  it('propagates repository errors', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findById: jest.fn().mockRejectedValue(new Error('db down')),
      },
    });

    await expect(sut.handler(123)).rejects.toThrow('db down');
    expect(tradeareaRepository.findById).toHaveBeenCalledWith(123);
  });
});
