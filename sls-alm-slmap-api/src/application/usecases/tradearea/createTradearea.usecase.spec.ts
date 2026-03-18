import { BadRequestException } from '@nestjs/common';
import { CreateTradeareaUseCase } from './createTradearea.usecase';

describe('CreateTradeareaUseCase', () => {
  /**
   * Build a polygon whose single coordinate sits exactly at the POI centre,
   * so the distance is 0 and the 600 m radius check always passes.
   */
  const CENTER_LAT = 13;
  const CENTER_LNG = 100;

  const makeValidPolygon = () => ({
    type: 'Polygon' as const,
    coordinates: [[[CENTER_LAT, CENTER_LNG]]],
  });

  /** POI with geom centred on CENTER_LAT / CENTER_LNG */
  const makePoiWithGeom = () => ({
    id: 5,
    geom: { coordinates: [CENTER_LAT, CENTER_LNG] },
  });

  it('creates tradearea, creates workflow transaction, updates wfTransactionId and returns created tradearea', async () => {
    const createdTradearea = { id: 10 };
    const poi = makePoiWithGeom();

    const tradeareaRepository = {
      findTradeareaTypeByName: jest.fn().mockResolvedValue({ id: 7 }),
      create: jest.fn().mockResolvedValue(createdTradearea),
      update: jest.fn().mockResolvedValue(undefined),
    } as any;

    const poiRepository = {
      findById: jest.fn().mockResolvedValue(poi),
    } as any;

    const createWorkflowTransactionUseCase = {
      handler: jest.fn().mockResolvedValue({
        success: true,
        data: { wfTransactionId: 'WF-123' },
      }),
    } as any;

    const uc = new CreateTradeareaUseCase(
      tradeareaRepository,
      poiRepository,
      createWorkflowTransactionUseCase,
    );

    const dto = {
      type: 'SOME_TYPE',
      zoneCode: 'bkk',
      subzoneCode: '01',
      shape: makeValidPolygon(),
      storeName: 'Store',
      areaColor: '#fff',
      comment: 'c',
      warning: 'w',
      poiId: poi.id,
    };

    const result = await uc.handler(dto as any, 99);

    expect(poiRepository.findById).toHaveBeenCalledWith(dto.poiId);

    expect(tradeareaRepository.findTradeareaTypeByName).toHaveBeenCalledWith(dto.type);

    expect(tradeareaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneCode: 'BKK',
        subzoneCode: dto.subzoneCode,
        shape: dto.shape,
        storeName: dto.storeName,
        areaColor: dto.areaColor,
        comment: dto.comment,
        warning: dto.warning,
        poiId: dto.poiId,
        tradeareaTypeId: 7,
      }),
    );

    expect(createWorkflowTransactionUseCase.handler).toHaveBeenCalledWith(
      1,
      createdTradearea.id,
      99,
    );

    expect(tradeareaRepository.update).toHaveBeenCalledWith(createdTradearea.id, {
      wfTransactionId: 'WF-123',
    });

    expect(result).toBe(createdTradearea);
  });

  it('throws BadRequestException when workflow transaction fails', async () => {
    const poi = makePoiWithGeom();

    const tradeareaRepository = {
      findTradeareaTypeByName: jest.fn().mockResolvedValue({ id: 7 }),
      create: jest.fn().mockResolvedValue({ id: 10 }),
      update: jest.fn(),
    } as any;

    const poiRepository = {
      findById: jest.fn().mockResolvedValue(poi),
    } as any;

    const createWorkflowTransactionUseCase = {
      handler: jest.fn().mockResolvedValue({
        success: false,
        error: { message: 'boom' },
      }),
    } as any;

    const uc = new CreateTradeareaUseCase(
      tradeareaRepository,
      poiRepository,
      createWorkflowTransactionUseCase,
    );

    const dto = {
      type: 'SOME_TYPE',
      zoneCode: 'bkk',
      subzoneCode: '01',
      shape: makeValidPolygon(),
      poiId: poi.id,
    };

    await expect(uc.handler(dto as any, 1)).rejects.toBeInstanceOf(BadRequestException);

    expect(tradeareaRepository.update).toHaveBeenCalledTimes(1);
    expect(tradeareaRepository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        deletedAt: expect.any(Date),
        status: 'INACTIVE',
      }),
    );
  });

  it('throws BadRequestException when POI is not found', async () => {
    const tradeareaRepository = {
      findTradeareaTypeByName: jest.fn(),
      create: jest.fn(),
    } as any;

    const poiRepository = {
      findById: jest.fn().mockResolvedValue(null),
    } as any;

    const uc = new CreateTradeareaUseCase(tradeareaRepository, poiRepository, {
      handler: jest.fn(),
    } as any);

    const dto = {
      type: 'SOME_TYPE',
      zoneCode: 'bkk',
      subzoneCode: '01',
      shape: makeValidPolygon(),
      poiId: 999,
    };

    await expect(uc.handler(dto as any, 1)).rejects.toBeInstanceOf(BadRequestException);
    expect(tradeareaRepository.findTradeareaTypeByName).not.toHaveBeenCalled();
    expect(tradeareaRepository.create).not.toHaveBeenCalled();
  });

  it('throws when shape.type is not Polygon', async () => {
    const poi = makePoiWithGeom();

    const tradeareaRepository = {
      findTradeareaTypeByName: jest.fn(),
      create: jest.fn(),
    } as any;

    const poiRepository = {
      findById: jest.fn().mockResolvedValue(poi),
    } as any;

    const uc = new CreateTradeareaUseCase(tradeareaRepository, poiRepository, {
      handler: jest.fn(),
    } as any);

    const dto = {
      type: 'SOME_TYPE',
      zoneCode: 'bkk',
      subzoneCode: '01',
      shape: { type: 'Point', coordinates: [100, 13] },
      poiId: poi.id,
    };

    await expect(uc.handler(dto as any, 1)).rejects.toThrow('Shape must be a Polygon');
    expect(tradeareaRepository.findTradeareaTypeByName).not.toHaveBeenCalled();
    expect(tradeareaRepository.create).not.toHaveBeenCalled();
  });

  it('throws when Polygon has no coordinates', async () => {
    const poi = makePoiWithGeom();

    const tradeareaRepository = {
      findTradeareaTypeByName: jest.fn(),
      create: jest.fn(),
    } as any;

    const poiRepository = {
      findById: jest.fn().mockResolvedValue(poi),
    } as any;

    const uc = new CreateTradeareaUseCase(tradeareaRepository, poiRepository, {
      handler: jest.fn(),
    } as any);

    const dto = {
      type: 'SOME_TYPE',
      zoneCode: 'bkk',
      subzoneCode: '01',
      shape: { type: 'Polygon', coordinates: [] },
      poiId: poi.id,
    };

    await expect(uc.handler(dto as any, 1)).rejects.toThrow(
      'Polygon must have coordinates',
    );
    expect(tradeareaRepository.findTradeareaTypeByName).not.toHaveBeenCalled();
    expect(tradeareaRepository.create).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when a coordinate exceeds 600 m radius', async () => {
    const poi = makePoiWithGeom();

    const tradeareaRepository = {
      findTradeareaTypeByName: jest.fn(),
      create: jest.fn(),
    } as any;

    const poiRepository = {
      findById: jest.fn().mockResolvedValue(poi),
    } as any;

    const uc = new CreateTradeareaUseCase(tradeareaRepository, poiRepository, {
      handler: jest.fn(),
    } as any);

    // Offset by ~1 degree latitude ≈ 111 km — well beyond 600 m
    const dto = {
      type: 'SOME_TYPE',
      zoneCode: 'bkk',
      subzoneCode: '01',
      shape: {
        type: 'Polygon' as const,
        coordinates: [[[CENTER_LAT + 1, CENTER_LNG]]],
      },
      poiId: poi.id,
    };

    await expect(uc.handler(dto as any, 1)).rejects.toBeInstanceOf(BadRequestException);
    expect(tradeareaRepository.findTradeareaTypeByName).not.toHaveBeenCalled();
    expect(tradeareaRepository.create).not.toHaveBeenCalled();
  });
});
