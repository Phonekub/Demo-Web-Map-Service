import { GetAllTradeareaUseCase } from './getAllTradearea.usecase';

describe('GetAllTradeareaUseCase', () => {
  it('should return repository result when it is truthy', async () => {
    const expected = { data: [{ id: 1 }], total: 1 };

    const tradeareaRepository = {
      findAll: jest.fn().mockResolvedValue(expected),
    } as any;

    const usecase = new GetAllTradeareaUseCase(tradeareaRepository);

    const result = await usecase.handler('q', 2, 'storeName', 'asc', 10, 'draft');

    expect(tradeareaRepository.findAll).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findAll).toHaveBeenCalledWith(
      'q',
      2,
      'storeName',
      'asc',
      10,
      'draft',
    );
    expect(result).toBe(expected);
  });

  it('should return default empty result when repository returns null', async () => {
    const tradeareaRepository = {
      findAll: jest.fn().mockResolvedValue(null),
    } as any;

    const usecase = new GetAllTradeareaUseCase(tradeareaRepository);

    const result = await usecase.handler('q');

    expect(tradeareaRepository.findAll).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findAll).toHaveBeenCalledWith(
      'q',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should return default empty result when repository returns undefined', async () => {
    const tradeareaRepository = {
      findAll: jest.fn().mockResolvedValue(undefined),
    } as any;

    const usecase = new GetAllTradeareaUseCase(tradeareaRepository);

    const result = await usecase.handler('q', 1);

    expect(tradeareaRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should propagate errors thrown by repository', async () => {
    const tradeareaRepository = {
      findAll: jest.fn().mockRejectedValue(new Error('db down')),
    } as any;

    const usecase = new GetAllTradeareaUseCase(tradeareaRepository);

    await expect(usecase.handler('q')).rejects.toThrow('db down');
    expect(tradeareaRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
