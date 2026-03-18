import { CheckPointInTradeareaUseCase } from './checkPointInTradearea.usecase';

describe('CheckPointInTradeareaUseCase', () => {
  it('should delegate to TradeareaRepository.findByPoint with lng/lat and return result', async () => {
    const expected = [{ id: 1 }, { id: 2 }];

    const tradeareaRepository = {
      findByPoint: jest.fn().mockResolvedValue(expected),
    } as any;

    const usecase = new CheckPointInTradeareaUseCase(tradeareaRepository);

    const lng = 100.1234;
    const lat = 13.5678;

    const result = await usecase.handler(lng, lat);

    expect(tradeareaRepository.findByPoint).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findByPoint).toHaveBeenCalledWith(lng, lat);
    expect(result).toBe(expected);
  });

  it('should propagate repository errors', async () => {
    const tradeareaRepository = {
      findByPoint: jest.fn().mockRejectedValue(new Error('db down')),
    } as any;

    const usecase = new CheckPointInTradeareaUseCase(tradeareaRepository);

    await expect(usecase.handler(100, 13)).rejects.toThrow('db down');
    expect(tradeareaRepository.findByPoint).toHaveBeenCalledWith(100, 13);
  });
});
