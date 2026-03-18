import { FindPoiTradeareaUseCase } from './findPoiTradearea.usecase';

describe('FindPoiTradeareaUseCase', () => {
  it('should call tradeareaRepository.findPoiTradeareaById with tradeareaId and return the result', async () => {
    const expected = { id: 123, poiId: 999 };

    const tradeareaRepository = {
      findPoiTradeareaById: jest.fn().mockResolvedValue(expected),
    } as any;

    const usecase = new FindPoiTradeareaUseCase(tradeareaRepository);

    const tradeareaId = 10;
    const result = await usecase.handler(tradeareaId);

    expect(tradeareaRepository.findPoiTradeareaById).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findPoiTradeareaById).toHaveBeenCalledWith(tradeareaId);
    expect(result).toBe(expected);
  });

  it('should return null when repository returns null', async () => {
    const tradeareaRepository = {
      findPoiTradeareaById: jest.fn().mockResolvedValue(null),
    } as any;

    const usecase = new FindPoiTradeareaUseCase(tradeareaRepository);

    await expect(usecase.handler(10)).resolves.toBeNull();
    expect(tradeareaRepository.findPoiTradeareaById).toHaveBeenCalledWith(10);
  });

  it('should propagate repository errors', async () => {
    const tradeareaRepository = {
      findPoiTradeareaById: jest.fn().mockRejectedValue(new Error('db down')),
    } as any;

    const usecase = new FindPoiTradeareaUseCase(tradeareaRepository);

    await expect(usecase.handler(10)).rejects.toThrow('db down');
    expect(tradeareaRepository.findPoiTradeareaById).toHaveBeenCalledWith(10);
  });
});
