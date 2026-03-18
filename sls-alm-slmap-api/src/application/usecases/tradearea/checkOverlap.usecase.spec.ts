import { CheckOverlapUseCase } from './checkOverlap.usecase';

describe('CheckOverlapUseCase', () => {
  it('should return hasOverlap=false when repository returns an empty array', async () => {
    const tradeareaRepository = {
      findById: jest.fn().mockResolvedValue({ id: 1, parentId: undefined }),
      findOverlapping: jest.fn().mockResolvedValue([]),
    } as any;

    const usecase = new CheckOverlapUseCase(tradeareaRepository);

    const dto = {
      shape: { type: 'Polygon', coordinates: [[[100, 13]]] },
      excludeId: 1,
      tradeareaTypeName: 'MAIN',
    };

    const result = await usecase.handler(dto as any);

    expect(tradeareaRepository.findById).toHaveBeenCalledWith(dto.excludeId);
    expect(tradeareaRepository.findOverlapping).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findOverlapping).toHaveBeenCalledWith(
      dto.shape,
      [dto.excludeId],
      dto.tradeareaTypeName,
    );

    expect(result).toEqual({
      hasOverlap: false,
      overlappingAreas: [],
    });
  });

  it('should return hasOverlap=true when repository returns overlapping areas', async () => {
    const overlappingAreas = [{ id: 1 }, { id: 2 }];

    const tradeareaRepository = {
      findById: jest.fn().mockResolvedValue({ id: 999, parentId: 500 }),
      findOverlapping: jest.fn().mockResolvedValue(overlappingAreas),
    } as any;

    const usecase = new CheckOverlapUseCase(tradeareaRepository);

    const dto = {
      shape: { any: 'shape' },
      excludeId: 999,
      tradeareaTypeName: 'SPECIAL',
    };

    const result = await usecase.handler(dto as any);

    expect(tradeareaRepository.findById).toHaveBeenCalledWith(dto.excludeId);
    expect(tradeareaRepository.findOverlapping).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.findOverlapping).toHaveBeenCalledWith(
      dto.shape,
      [dto.excludeId, 500],
      dto.tradeareaTypeName,
    );

    expect(result.hasOverlap).toBe(true);
    expect(result.overlappingAreas).toBe(overlappingAreas);
  });
});
