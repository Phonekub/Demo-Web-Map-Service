import { Test, TestingModule } from '@nestjs/testing';
import { SpatialSearchUseCase } from './spatialSearch.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { SpatialType } from '../../../adapter/inbound/dtos/search.dto';
import { JwtPayload } from '@common/interfaces/jwtPayload';

describe('SpatialSearchUseCase', () => {
  let useCase: SpatialSearchUseCase;

  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;
  let mockTradeareaRepository: jest.Mocked<TradeareaRepositoryPort>;

  const accessArea: Record<string, string[]> = {
    Z001: ['SZ001', 'SZ002'],
    Z002: ['SZ003'],
  };

  const mockPayload: Partial<JwtPayload> = {
    zoneCodes: accessArea,
    storeCode: null,
  };

  const boundaryArea: [string, string][] = [
    ['Z001', 'SZ001'],
    ['Z001', 'SZ002'],
    ['Z002', 'SZ003'],
  ];

  const coordinates: [number, number][] = [
    [100.5, 13.7],
    [100.6, 13.7],
    [100.6, 13.8],
    [100.5, 13.8],
    [100.5, 13.7],
  ];

  beforeEach(async () => {
    const poiRepo: Partial<jest.Mocked<PoiRepositoryPort>> = {
      findPoisByPolygon: jest.fn(),
      findPoisByPolygonGroupByLayer: jest.fn(),
      findPoiLocationByQuery: jest.fn(),
      findById: jest.fn(),
      findZoneAndSubZoneByCoordinate: jest.fn(),
    };

    const tradeareaRepo: Partial<jest.Mocked<TradeareaRepositoryPort>> = {
      findTradeareasByPolygon: jest.fn(),
      findTradeareasForSearch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpatialSearchUseCase,
        { provide: 'PoiRepository', useValue: poiRepo },
        { provide: 'TradeareaRepository', useValue: tradeareaRepo },
      ],
    }).compile();

    useCase = module.get<SpatialSearchUseCase>(SpatialSearchUseCase);
    mockPoiRepository = module.get('PoiRepository');
    mockTradeareaRepository = module.get('TradeareaRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should return empty result when accessArea has no zone codes', async () => {
      const query = {
        spatialType: SpatialType.SEVEN_ELEVEN,
        coordinates,
      } as any;

      const result = await useCase.handler(query, { zoneCodes: {} } as any);

      expect(result).toEqual([{ search: [], poi: [] }, 0]);
      expect(mockPoiRepository.findPoisByPolygon).not.toHaveBeenCalled();
      expect(mockTradeareaRepository.findTradeareasByPolygon).not.toHaveBeenCalled();
    });

    it('should throw when spatialType is not implemented', async () => {
      const query = {
        spatialType: '__UNKNOWN__',
        coordinates,
      } as any;

      await expect(useCase.handler(query, mockPayload as JwtPayload)).rejects.toThrow(
        'Spatial search type __UNKNOWN__ is not implemented yet',
      );
    });

    it('should call seven-eleven polygon search and also fetch all POIs (limit=1000)', async () => {
      const query = {
        spatialType: SpatialType.SEVEN_ELEVEN,
        coordinates,
      } as any;

      const searchRows = [
        {
          id: 1,
          branchName: '7-11 A',
          geom: { type: 'Point', coordinates: [100.51, 13.71] },
          layer: { symbol: 'seven' },
        },
      ];

      const allRows = [
        ...searchRows,
        {
          id: 2,
          branchName: '7-11 B',
          geom: { type: 'Point', coordinates: [100.52, 13.72] },
          layer: { symbol: 'seven' },
        },
      ];

      (mockPoiRepository.findPoisByPolygon as any)
        .mockResolvedValueOnce([searchRows, 99]) // main search
        .mockResolvedValueOnce([allRows, 2]); // all-poi

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(99);
      expect((data as any).search).toEqual(searchRows);
      expect((data as any).poi).toEqual([
        {
          id: 1,
          name: '7-11 A',
          coordinates: [100.51, 13.71],
          symbol: 'seven',
        },
        {
          id: 2,
          name: '7-11 B',
          coordinates: [100.52, 13.72],
          symbol: 'seven',
        },
      ]);

      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'sevenEleven',
        }),
      );
      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'sevenEleven',
          limit: 1000,
        }),
      );
    });

    it('should call competitor polygon search and fetch all competitors (limit=1000)', async () => {
      const query = {
        spatialType: SpatialType.FILTER_COMPETITOR,
        coordinates,
      } as any;

      const searchRows = [
        {
          id: 10,
          branchName: 'Comp A',
          geom: { type: 'Point', coordinates: [1, 2] },
        },
      ];

      const allRows = [
        ...searchRows,
        {
          id: 11,
          branchName: 'Comp B',
          geom: { type: 'Point', coordinates: [3, 4] },
        },
      ];

      (mockPoiRepository.findPoisByPolygon as any)
        .mockResolvedValueOnce([searchRows, 1])
        .mockResolvedValueOnce([allRows, 2]);

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(1);
      expect((data as any).search).toEqual(searchRows);
      expect((data as any).poi).toEqual([
        { id: 10, name: 'Comp A', coordinates: [1, 2] },
        { id: 11, name: 'Comp B', coordinates: [3, 4] },
      ]);

      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'competitor',
        }),
      );
      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'competitor',
          limit: 1000,
        }),
      );
    });

    it('should call potential polygon search and format symbol as `${layer.symbol}-${status}.png`', async () => {
      const query = {
        spatialType: SpatialType.FILTER_POTENTIAL,
        coordinates,
      } as any;

      const searchRows = [
        {
          id: 20,
          branchName: 'Potential A',
          status: 'active',
          geom: { type: 'Point', coordinates: [9, 9] },
          layer: { symbol: 'potential' },
        },
      ];

      (mockPoiRepository.findPoisByPolygon as any)
        .mockResolvedValueOnce([searchRows, 1])
        .mockResolvedValueOnce([searchRows, 1]);

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(1);
      expect((data as any).poi).toEqual([
        {
          id: 20,
          name: 'Potential A',
          coordinates: [9, 9],
          symbol: 'potential-active.png',
        },
      ]);
    });

    it('should call station polygon search (otherPlace)', async () => {
      const query = {
        spatialType: SpatialType.FILTER_STATION,
        coordinates,
      } as any;

      const searchRows = [
        {
          id: 30,
          branchName: 'Station A',
          geom: { type: 'Point', coordinates: [10, 11] },
        },
      ];

      (mockPoiRepository.findPoisByPolygon as any)
        .mockResolvedValueOnce([searchRows, 1])
        .mockResolvedValueOnce([searchRows, 1]);

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(1);
      expect((data as any).search).toEqual(searchRows);
      expect((data as any).poi).toEqual([
        { id: 30, name: 'Station A', coordinates: [10, 11] },
      ]);

      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'otherPlace',
        }),
      );
      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'otherPlace',
          limit: 1000,
        }),
      );
    });

    it('should call vending polygon search', async () => {
      const query = {
        spatialType: SpatialType.FILTER_VENDING,
        coordinates,
      } as any;

      const rows = [
        {
          id: 40,
          branchName: 'Vending A',
          geom: { type: 'Point', coordinates: [12, 13] },
        },
      ];

      (mockPoiRepository.findPoisByPolygon as any)
        .mockResolvedValueOnce([rows, 1])
        .mockResolvedValueOnce([rows, 1]);

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(1);
      expect((data as any).poi).toEqual([
        { id: 40, name: 'Vending A', coordinates: [12, 13] },
      ]);

      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'vending',
        }),
      );
      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'vending',
          limit: 1000,
        }),
      );
    });

    it('should call permanent closed polygon search', async () => {
      const query = {
        spatialType: SpatialType.FILTER_PERMANENT_CLOSED,
        coordinates,
      } as any;

      const rows = [
        {
          id: 50,
          branchName: 'Closed A',
          geom: { type: 'Point', coordinates: [20, 21] },
        },
      ];

      (mockPoiRepository.findPoisByPolygon as any)
        .mockResolvedValueOnce([rows, 1])
        .mockResolvedValueOnce([rows, 1]);

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(1);
      expect((data as any).poi).toEqual([
        { id: 50, name: 'Closed A', coordinates: [20, 21] },
      ]);

      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'permanentClosed',
        }),
      );
      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'permanentClosed',
          limit: 1000,
        }),
      );
    });

    it('should call seven impact competitor polygon search', async () => {
      const query = {
        spatialType: SpatialType.SEVEN_IMPACT_COMPETITOR,
        coordinates,
      } as any;

      const rows = [
        {
          id: 60,
          branchName: 'Impact Comp A',
          geom: { type: 'Point', coordinates: [30, 31] },
        },
      ];

      (mockPoiRepository.findPoisByPolygon as any)
        .mockResolvedValueOnce([rows, 1])
        .mockResolvedValueOnce([rows, 1]);

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(1);
      expect((data as any).poi).toEqual([
        { id: 60, name: 'Impact Comp A', coordinates: [30, 31] },
      ]);

      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'sevenImpactCompetitor',
        }),
      );
      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          coordinates,
          boundaryArea,
          storeType: 'sevenImpactCompetitor',
          limit: 1000,
        }),
      );
    });

    it('should call trade area polygon search and format output', async () => {
      const query = {
        spatialType: SpatialType.TRADE_AREA,
        coordinates,
      } as any;

      const tradeareas = [
        {
          id: 1,
          globalId: 'TA-UID-1',
          storeName: 'TA Store',
          storeCode: 'TA001',
          locationT: 'Somewhere',
          lat: 13.7,
          lng: 100.5,
          poiId: '999',
          shape: { type: 'Polygon', coordinates: [[[100.5, 13.7]]] },
          areaColor: '#FF0000',
        },
        {
          id: 2,
          globalId: 'TA-UID-2',
          storeName: 'TA Store 2',
          storeCode: 'TA002',
          locationT: 'Elsewhere',
          lat: null,
          lng: null,
          poiId: null,
          shape: { type: 'Polygon', coordinates: [[[100.6, 13.8]]] },
          areaColor: null,
        },
      ] as any;

      (mockTradeareaRepository.findTradeareasByPolygon as any).mockResolvedValue([
        tradeareas,
        2,
      ]);

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(2);
      expect((data as any).search).toEqual([
        {
          id: 1,
          uid: 'TA-UID-1',
          branchName: 'TA Store',
          branchCode: 'TA001',
          location: 'Somewhere',
          geom: { type: 'Point', coordinates: [100.5, 13.7] },
          area: { id: 1, shape: 'polygon', coordinates: [] },
          poiId: 999,
        },
        {
          id: 2,
          uid: 'TA-UID-2',
          branchName: 'TA Store 2',
          branchCode: 'TA002',
          location: 'Elsewhere',
          geom: null,
          area: { id: 2, shape: 'polygon', coordinates: [] },
          poiId: undefined,
        },
      ]);

      expect((data as any).poi).toEqual([
        {
          id: 1,
          name: 'TA Store',
          type: 'Polygon',
          coordinates: [[[100.5, 13.7]]],
          areaColor: '#FF0000',
        },
        {
          id: 2,
          name: 'TA Store 2',
          type: 'Polygon',
          coordinates: [[[100.6, 13.8]]],
          areaColor: undefined,
        },
      ]);

      expect(mockTradeareaRepository.findTradeareasByPolygon).toHaveBeenCalledTimes(1);
      expect(mockTradeareaRepository.findTradeareasByPolygon).toHaveBeenCalledWith(
        coordinates,
        boundaryArea,
      );
    });

    it('should call backup profile polygon search group-by-layer and return layers + total', async () => {
      const query = {
        spatialType: SpatialType.BACKUP_PROFILE,
        coordinates,
      } as any;

      const pois = [
        {
          id: 1,
          layerId: 10,
          layerName: 'Layer 10',
          layerTh: 'เลเยอร์ 10',
          layerEn: 'Layer 10',
          layerKh: 'Layer 10',
          subCode: 'X',
          profileSubCategoryId: 100,
          formConfigId: 1000,
        },
        {
          id: 2,
          layerId: 10,
          layerName: 'Layer 10',
          layerTh: 'เลเยอร์ 10',
          layerEn: 'Layer 10',
          layerKh: 'Layer 10',
          subCode: 'X',
          profileSubCategoryId: 100,
          formConfigId: 1000,
        },
        {
          id: 3,
          layerId: 10,
          layerName: 'Layer 10',
          subCode: 'Y',
          profileSubCategoryId: 101,
          formConfigId: null,
        },
        {
          id: 4,
          layerId: 11,
          layerName: 'Layer 11',
          subCode: 'Z',
          profileSubCategoryId: 200,
          formConfigId: 2000,
        },
        // This one should be ignored due to missing subCode
        {
          id: 999,
          layerId: 12,
          layerName: 'IGNORED',
          subCode: null,
          profileSubCategoryId: 999,
          formConfigId: 9999,
        },
      ] as any;

      (mockPoiRepository.findPoisByPolygonGroupByLayer as any).mockResolvedValue([
        pois,
        4,
      ]);

      const [data, total] = await useCase.handler(query, mockPayload as JwtPayload);

      expect(total).toBe(4);
      expect((data as any).layers).toBeDefined();
      expect(Array.isArray((data as any).layers)).toBe(true);

      // Should have 2 layer groups: 10 and 11 (layer 12 ignored)
      const layers = (data as any).layers as any[];
      expect(layers).toHaveLength(2);

      const layer10 = layers.find((l) => l.layerId === 10);
      expect(layer10).toBeDefined();
      expect(layer10.layerName).toBe('Layer 10');
      expect(layer10.subCategories).toHaveLength(2);

      const sub100 = layer10.subCategories.find((s) => s.profileSubCategoryId === 100);
      expect(sub100).toBeDefined();
      expect(sub100.formConfigId).toBe(1000);
      expect(sub100.pois.map((p) => p.id)).toEqual([1, 2]);

      const sub101 = layer10.subCategories.find((s) => s.profileSubCategoryId === 101);
      expect(sub101).toBeDefined();
      expect(sub101.formConfigId).toBeNull();
      expect(sub101.pois.map((p) => p.id)).toEqual([3]);

      const layer11 = layers.find((l) => l.layerId === 11);
      expect(layer11).toBeDefined();
      expect(layer11.subCategories).toHaveLength(1);

      expect(mockPoiRepository.findPoisByPolygonGroupByLayer).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findPoisByPolygonGroupByLayer).toHaveBeenCalledWith(
        coordinates,
        boundaryArea,
        1000,
        0,
      );
    });

    it('should propagate repository errors', async () => {
      const query = {
        spatialType: SpatialType.SEVEN_ELEVEN,
        coordinates,
      } as any;

      const err = new Error('db error');
      (mockPoiRepository.findPoisByPolygon as any).mockRejectedValue(err);

      await expect(useCase.handler(query, mockPayload as JwtPayload)).rejects.toThrow(
        err,
      );
      expect(mockPoiRepository.findPoisByPolygon).toHaveBeenCalledTimes(1);
    });
  });
});
