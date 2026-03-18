import { FindTradeareaTypeUseCase } from './findTradeareaType.usecase';

describe('FindTradeareaTypeUseCase', () => {
  it('should return tradearea types from repository', async () => {
    const types = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];

    const tradeareaRepository = {
      findTradeareaTypes: jest.fn().mockResolvedValue(types),
    } as any;

    const usecase = new FindTradeareaTypeUseCase(tradeareaRepository);

    await expect(usecase.handler()).resolves.toBe(types);
    expect(tradeareaRepository.findTradeareaTypes).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findTradeareaTypes).toHaveBeenCalledWith();
  });

  it('should propagate repository errors', async () => {
    const tradeareaRepository = {
      findTradeareaTypes: jest.fn().mockRejectedValue(new Error('db down')),
    } as any;

    const usecase = new FindTradeareaTypeUseCase(tradeareaRepository);

    await expect(usecase.handler()).rejects.toThrow('db down');
    expect(tradeareaRepository.findTradeareaTypes).toHaveBeenCalledTimes(1);
  });
});
