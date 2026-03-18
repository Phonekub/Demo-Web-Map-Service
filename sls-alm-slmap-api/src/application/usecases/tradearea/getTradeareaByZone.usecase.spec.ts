import { GetTradeareaByZoneUseCase } from './getTradeareaByZone.usecase';

describe('GetTradeareaByZoneUseCase', () => {
  it('should delegate to TradeareaRepository.findByZone(zoneCode) and return its result', async () => {
    const expected = [{ id: 1 }, { id: 2 }];

    const tradeareaRepository = {
      findByZone: jest.fn().mockResolvedValue(expected),
    } as any;

    const usecase = new GetTradeareaByZoneUseCase(tradeareaRepository);

    const zoneCode = 'BKK';
    const result = await usecase.handler(zoneCode);

    expect(tradeareaRepository.findByZone).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findByZone).toHaveBeenCalledWith(zoneCode);
    expect(result).toBe(expected);
  });

  it('should work with empty string input (no validation in use case)', async () => {
    const tradeareaRepository = {
      findByZone: jest.fn().mockResolvedValue([]),
    } as any;

    const usecase = new GetTradeareaByZoneUseCase(tradeareaRepository);

    const result = await usecase.handler('');

    expect(tradeareaRepository.findByZone).toHaveBeenCalledWith('');
    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    const tradeareaRepository = {
      findByZone: jest.fn().mockRejectedValue(new Error('db down')),
    } as any;

    const usecase = new GetTradeareaByZoneUseCase(tradeareaRepository);

    await expect(usecase.handler('BKK')).rejects.toThrow('db down');
    expect(tradeareaRepository.findByZone).toHaveBeenCalledWith('BKK');
  });
});
