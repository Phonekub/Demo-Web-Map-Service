import { BadRequestException } from '@nestjs/common';
import { GetTradeareaByStoreCodeUseCase } from './getTradeareaByStoreCode.usecase';

describe('GetTradeareaByStoreCodeUseCase', () => {
  const makeSut = (overrides?: { tradeareaRepository?: any }) => {
    const tradeareaRepository =
      overrides?.tradeareaRepository ??
      ({
        findTradeareaTypeByName: jest.fn(),
        findByStoreCode: jest.fn(),
      } as any);

    const sut = new GetTradeareaByStoreCodeUseCase(tradeareaRepository);

    return { sut, tradeareaRepository };
  };

  it('throws BadRequestException when storeCode is empty string', async () => {
    const { sut, tradeareaRepository } = makeSut();

    await expect(sut.handler('', 'MAIN' as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tradeareaRepository.findTradeareaTypeByName).not.toHaveBeenCalled();
    expect(tradeareaRepository.findByStoreCode).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when storeCode is whitespace', async () => {
    const { sut, tradeareaRepository } = makeSut();

    await expect(sut.handler('   ', 'MAIN' as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tradeareaRepository.findTradeareaTypeByName).not.toHaveBeenCalled();
    expect(tradeareaRepository.findByStoreCode).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when storeCode is null/undefined', async () => {
    const { sut, tradeareaRepository } = makeSut();

    await expect(sut.handler(null as any, 'MAIN' as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(sut.handler(undefined as any, 'MAIN' as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(tradeareaRepository.findTradeareaTypeByName).not.toHaveBeenCalled();
    expect(tradeareaRepository.findByStoreCode).not.toHaveBeenCalled();
  });

  it('looks up tradearea type by name then queries by storeCode and type id', async () => {
    const expected = [{ id: 1 }, { id: 2 }];
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findTradeareaTypeByName: jest.fn().mockResolvedValue({ id: 5 }),
        findByStoreCode: jest.fn().mockResolvedValue(expected),
      } as any,
    });

    const result = await sut.handler('00001', 'MAIN' as any);

    expect(tradeareaRepository.findTradeareaTypeByName).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findTradeareaTypeByName).toHaveBeenCalledWith('MAIN');

    expect(tradeareaRepository.findByStoreCode).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findByStoreCode).toHaveBeenCalledWith('00001', 5);

    expect(result).toBe(expected);
  });

  it('propagates errors from findTradeareaTypeByName', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findTradeareaTypeByName: jest
          .fn()
          .mockRejectedValue(new Error('type lookup failed')),
        findByStoreCode: jest.fn(),
      } as any,
    });

    await expect(sut.handler('00001', 'MAIN' as any)).rejects.toThrow(
      'type lookup failed',
    );

    expect(tradeareaRepository.findTradeareaTypeByName).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findByStoreCode).not.toHaveBeenCalled();
  });

  it('propagates errors from findByStoreCode', async () => {
    const { sut, tradeareaRepository } = makeSut({
      tradeareaRepository: {
        findTradeareaTypeByName: jest.fn().mockResolvedValue({ id: 5 }),
        findByStoreCode: jest.fn().mockRejectedValue(new Error('db down')),
      } as any,
    });

    await expect(sut.handler('00001', 'MAIN' as any)).rejects.toThrow('db down');

    expect(tradeareaRepository.findTradeareaTypeByName).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findByStoreCode).toHaveBeenCalledTimes(1);
  });
});
