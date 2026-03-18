import { Test, TestingModule } from '@nestjs/testing';
import { SearchPoiUseCase } from './searchPoi.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { SearchType } from '../../../adapter/inbound/dtos/search.dto';
import { JwtPayload } from '../../../common/interfaces/jwtPayload';

describe('SearchPoiUseCase', () => {
  let useCase: SearchPoiUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;
  let mockTradeareaRepository: jest.Mocked<TradeareaRepositoryPort>;

  const boundaryArea: [string, string][] = [
    ['Z001', 'SZ001'],
    ['Z001', 'SZ002'],
    ['Z002', 'SZ003'],
  ];

  const mockJwtPayload: JwtPayload = {
    id: 1,
    employeeId: 'EMP001',
    fullName: 'Test User',
    departmentId: 'DEPT001',
    levelId: 'LEVEL001',
    roleId: 1,
    zoneCodes: {
      Z001: ['SZ001', 'SZ002'],
      Z002: ['SZ003'],
    },
    permissions: ['READ', 'WRITE'],
    storeCode: [],
  };

  const emptyJwtPayload: JwtPayload = {
    id: 1,
    employeeId: 'EMP001',
    fullName: 'Test User',
    departmentId: 'DEPT001',
    levelId: 'LEVEL001',
    roleId: 1,
    zoneCodes: {},
    permissions: [],
    storeCode: [],
  };

  beforeEach(async () => {
    const poiRepo: Partial<jest.Mocked<PoiRepositoryPort>> = {
      findSevenStore: jest.fn(),
      findCompetitorStore: jest.fn(),
      findPotentialStore: jest.fn(),
      findOtherPlace: jest.fn(),
      findClosedSevenEleven: jest.fn(),
      findClosedCompetitor: jest.fn(),
      findVendingMachineStore: jest.fn(),
      findSevenImpactCompetitor: jest.fn(),
      findPoiLocationByQuery: jest.fn(),
      findById: jest.fn(),
      findZoneAndSubZoneByCoordinate: jest.fn(),
    };

    const tradeareaRepo: Partial<jest.Mocked<TradeareaRepositoryPort>> = {
      findTradeareasForSearch: jest.fn(),
      findTradeareasByPolygon: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchPoiUseCase,
        { provide: 'PoiRepository', useValue: poiRepo },
        { provide: 'TradeareaRepository', useValue: tradeareaRepo },
      ],
    }).compile();

    useCase = module.get<SearchPoiUseCase>(SearchPoiUseCase);
    mockPoiRepository = module.get('PoiRepository');
    mockTradeareaRepository = module.get('TradeareaRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should return empty result when accessArea has no zone codes', async () => {
      const query = { type: SearchType.SEVEN_ELEVEN } as any;
      const result = await useCase.handler(query, emptyJwtPayload);
      expect(result).toEqual([[], 0]);
      expect(mockPoiRepository.findSevenStore).not.toHaveBeenCalled();
    });

    it('should throw when query.type is not implemented', async () => {
      const query = { type: '__UNKNOWN__' } as any;
      await expect(useCase.handler(query, mockJwtPayload)).rejects.toThrow(
        'Search type __UNKNOWN__ is not implemented yet',
      );
    });

    it('should call seven-eleven search path and respect displayOnMap=false (no POI fetch)', async () => {
      const query = {
        type: SearchType.SEVEN_ELEVEN,
        text: 'abc',
        radius: 300,
        limit: 10,
        page: 1,
        displayOnMap: false,
      } as any;

      const searchRows = [
        {
          id: 1,
          branchName: '7-11 A',
          geom: { type: 'Point', coordinates: [100.1, 13.1] },
          layer: { symbol: 'seven' },
        },
      ];

      (mockPoiRepository.findSevenStore as any).mockResolvedValueOnce([searchRows, 1]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(1);
      expect((data as any).search).toEqual(searchRows);
      expect((data as any).poi).toEqual([]);

      expect(mockPoiRepository.findSevenStore).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findSevenStore).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'abc',
          radius: 300,
          limit: 10,
          page: 1,
          displayOnMap: false,
        }),
        boundaryArea,
        mockJwtPayload.storeCode,
        10,
        0,
      );
    });

    it('should call seven-eleven search path and fetch POI list when displayOnMap is not false', async () => {
      const query = {
        type: SearchType.SEVEN_ELEVEN,
        text: 'abc',
        radius: 300,
        limit: 2,
        page: 2,
        // displayOnMap omitted => should fetch POI
      } as any;

      const pageRows = [
        {
          id: 10,
          branchName: '7-11 Paged',
          geom: { type: 'Point', coordinates: [100.2, 13.2] },
          layer: { symbol: 'seven' },
        },
      ];
      const allRows = [
        {
          id: 10,
          branchName: '7-11 Paged',
          geom: { type: 'Point', coordinates: [100.2, 13.2] },
          layer: { symbol: 'seven' },
        },
        {
          id: 11,
          branchName: '7-11 Other',
          geom: { type: 'Point', coordinates: [100.3, 13.3] },
          layer: { symbol: 'seven' },
        },
      ];

      (mockPoiRepository.findSevenStore as any)
        .mockResolvedValueOnce([pageRows, 99]) // paged
        .mockResolvedValueOnce([allRows, 2]); // all-poi

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(99);
      expect((data as any).search).toEqual(pageRows);
      expect((data as any).poi).toEqual([
        {
          id: 10,
          name: '7-11 Paged',
          coordinates: [100.2, 13.2],
          radius: 300,
          symbol: 'seven.png',
        },
        {
          id: 11,
          name: '7-11 Other',
          coordinates: [100.3, 13.3],
          radius: 300,
          symbol: 'seven.png',
        },
      ]);

      // limit/page=2 => offset=(2-1)*2=2
      expect(mockPoiRepository.findSevenStore).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ page: 2, limit: 2 }),
        boundaryArea,
        mockJwtPayload.storeCode,
        2,
        2,
      );
      expect(mockPoiRepository.findSevenStore).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        boundaryArea,
        mockJwtPayload.storeCode,
        1000,
      );
    });

    it('should call competitor search path and always fetch all-poi list', async () => {
      const query = {
        type: SearchType.COMPETITOR,
        text: 'x',
        radius: 123,
        limit: 3,
        page: 1,
      } as any;

      const paged = [
        {
          id: 1,
          branchName: 'Comp 1',
          geom: { type: 'Point', coordinates: [1, 2] },
        },
      ];
      const all = [
        {
          id: 1,
          branchName: 'Comp 1',
          geom: { type: 'Point', coordinates: [1, 2] },
        },
        {
          id: 2,
          branchName: 'Comp 2',
          geom: { type: 'Point', coordinates: [3, 4] },
        },
      ];

      (mockPoiRepository.findCompetitorStore as any)
        .mockResolvedValueOnce([paged, 10])
        .mockResolvedValueOnce([all, 2]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(10);
      expect((data as any).search).toEqual(paged);
      expect((data as any).poi).toEqual([
        { id: 1, name: 'Comp 1', coordinates: [1, 2], radius: 123 },
        { id: 2, name: 'Comp 2', coordinates: [3, 4], radius: 123 },
      ]);

      expect(mockPoiRepository.findCompetitorStore).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ text: 'x', limit: 3, page: 1, radius: 123 }),
        boundaryArea,
        3,
        0,
      );
      expect(mockPoiRepository.findCompetitorStore).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        boundaryArea,
        1000,
      );
    });

    it('should call potential search path and format symbol with status', async () => {
      const query = {
        type: SearchType.POTENTIAL,
        text: 'p',
        radius: 50,
        limit: 10,
        page: 1,
        status: 'new',
      } as any;

      const paged = [
        {
          id: 5,
          branchName: 'Potential 5',
          status: 'active',
          geom: { type: 'Point', coordinates: [10, 20] },
          layer: { symbol: 'potential' },
        },
      ];
      (mockPoiRepository.findPotentialStore as any)
        .mockResolvedValueOnce([paged, 1])
        .mockResolvedValueOnce([paged, 1]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(1);
      expect((data as any).poi).toEqual([
        {
          id: 5,
          name: 'Potential 5',
          coordinates: [10, 20],
          radius: 50,
          symbol: 'potential-active.png',
        },
      ]);
    });

    it('should call other place search path', async () => {
      const query = {
        type: SearchType.OTHER_PLACE,
        text: 'o',
        radius: 88,
        limit: 1,
        page: 1,
        layerId: 99,
      } as any;

      const paged = [
        { id: 7, branchName: 'Other', geom: { type: 'Point', coordinates: [9, 9] } },
      ];

      (mockPoiRepository.findOtherPlace as any)
        .mockResolvedValueOnce([paged, 1])
        .mockResolvedValueOnce([paged, 1]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(1);
      expect((data as any).search).toEqual(paged);
      expect((data as any).poi).toEqual([
        { id: 7, name: 'Other', coordinates: [9, 9], radius: 88 },
      ]);

      expect(mockPoiRepository.findOtherPlace).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ layerId: 99 }),
        boundaryArea,
        1,
        0,
      );
    });

    it('should return empty for closed store when close_type is invalid', async () => {
      const query = {
        type: SearchType.CLOSED_STORE,
        close_type: 'SOMETHING_ELSE',
        limit: 10,
        page: 1,
      } as any;

      const [data, total] = await useCase.handler(query, mockJwtPayload);
      expect(total).toBe(0);
      expect(data).toEqual({ search: [], poi: [] });
      expect(mockPoiRepository.findClosedSevenEleven).not.toHaveBeenCalled();
      expect(mockPoiRepository.findClosedCompetitor).not.toHaveBeenCalled();
    });

    it('should combine closed store results when close_type is all', async () => {
      const query = {
        type: SearchType.CLOSED_STORE,
        close_type: 'all',
        limit: 2,
        page: 1,
        radius: 999,
      } as any;

      const seven = [
        {
          id: 2,
          branchName: 'SevenClosed',
          geom: { type: 'Point', coordinates: [1, 1] },
        },
      ];
      const comp = [
        { id: 1, branchName: 'CompClosed', geom: { type: 'Point', coordinates: [2, 2] } },
        {
          id: 3,
          branchName: 'CompClosed2',
          geom: { type: 'Point', coordinates: [3, 3] },
        },
      ];

      // handler: two calls for paged results, then searchAllPoiClosedStore will call both again with limit=1000
      (mockPoiRepository.findClosedSevenEleven as any)
        .mockResolvedValueOnce([seven, 1])
        .mockResolvedValueOnce([seven, 1]);
      (mockPoiRepository.findClosedCompetitor as any)
        .mockResolvedValueOnce([comp, 2])
        .mockResolvedValueOnce([comp, 2]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      // combined length
      expect(total).toBe(3);

      // sorted by id then paginated limit=2
      expect((data as any).search).toEqual([
        { id: 1, branchName: 'CompClosed', geom: { type: 'Point', coordinates: [2, 2] } },
        {
          id: 2,
          branchName: 'SevenClosed',
          geom: { type: 'Point', coordinates: [1, 1] },
        },
      ]);

      expect((data as any).poi).toEqual([
        { id: 2, name: 'SevenClosed', coordinates: [1, 1], radius: 999 },
        { id: 1, name: 'CompClosed', coordinates: [2, 2], radius: 999 },
        { id: 3, name: 'CompClosed2', coordinates: [3, 3], radius: 999 },
      ]);
    });

    it('should query only closed seven when close_type is sevenEleven (case-insensitive, trimmed)', async () => {
      const query = {
        type: SearchType.CLOSED_STORE,
        close_type: '  sevenEleven  ',
        limit: 10,
        page: 1,
        radius: 10,
      } as any;

      const seven = [
        {
          id: 1,
          branchName: 'SevenClosed',
          geom: { type: 'Point', coordinates: [1, 1] },
        },
      ];

      (mockPoiRepository.findClosedSevenEleven as any)
        .mockResolvedValueOnce([seven, 1])
        .mockResolvedValueOnce([seven, 1]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(1);
      expect((data as any).search).toEqual(seven);
      expect((data as any).poi).toEqual([
        { id: 1, name: 'SevenClosed', coordinates: [1, 1], radius: 10 },
      ]);

      expect(mockPoiRepository.findClosedCompetitor).not.toHaveBeenCalled();
      expect(mockPoiRepository.findClosedSevenEleven).toHaveBeenCalled();
    });

    it('should call vending machine search path', async () => {
      const query = {
        type: SearchType.VENDING_MACHINE,
        limit: 1,
        page: 1,
        radius: 5,
      } as any;

      const rows = [
        { id: 9, branchName: 'VM', geom: { type: 'Point', coordinates: [9, 9] } },
      ];

      (mockPoiRepository.findVendingMachineStore as any)
        .mockResolvedValueOnce([rows, 1])
        .mockResolvedValueOnce([rows, 1]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(1);
      expect((data as any).poi).toEqual([
        { id: 9, name: 'VM', coordinates: [9, 9], radius: 5 },
      ]);
    });

    it('should call seven impact competitor search path', async () => {
      const query = {
        type: SearchType.SEVEN_IMPACT_COMPETITOR,
        limit: 10,
        page: 1,
        radius: 77,
      } as any;

      const rows = [
        { id: 20, branchName: 'SIC', geom: { type: 'Point', coordinates: [2, 0] } },
      ];

      (mockPoiRepository.findSevenImpactCompetitor as any)
        .mockResolvedValueOnce([rows, 1])
        .mockResolvedValueOnce([rows, 1]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(1);
      expect((data as any).search).toEqual(rows);
      expect((data as any).poi).toEqual([
        { id: 20, name: 'SIC', coordinates: [2, 0], radius: 77 },
      ]);
    });

    it('should call trade area search path and parse shape when it is string', async () => {
      const query = {
        type: SearchType.TRADE_AREA,
        limit: 2,
        page: 1,
        radius: 123,
        countryCode: 'TH',
        provinceCode: '10',
        districtCode: '1001',
        subDistrictCode: '100101',
        status: 'active',
        approvalType: 'approved',
        tradeAreaType: 'A',
        text: 'x',
      } as any;

      const pageTradeareas = [
        {
          id: 1,
          globalId: 'TA-UID-1',
          storeName: 'TA Store',
          storeCode: 'TA001',
          locationT: 'Somewhere',
          lat: 13.7,
          lng: 100.5,
          shape: JSON.stringify({
            type: 'Polygon',
            coordinates: [[[100.5, 13.7]]],
          }),
          poiId: 999,
        },
      ];

      const allTradeareas = [
        {
          ...pageTradeareas[0],
          // keep string shape too
        },
      ];

      (mockTradeareaRepository.findTradeareasForSearch as any)
        .mockResolvedValueOnce([pageTradeareas, 1])
        .mockResolvedValueOnce([allTradeareas, 1]);

      const [data, total] = await useCase.handler(query, mockJwtPayload);

      expect(total).toBe(1);
      expect((data as any).search).toEqual([
        {
          id: 1,
          uid: 'TA-UID-1',
          branchName: 'TA Store',
          branchCode: 'TA001',
          location: 'Somewhere',
          geom: { type: 'Point', coordinates: [100.5, 13.7] },
          area: { id: 1, shape: 'Polygon', coordinates: [[[100.5, 13.7]]] },
          poiId: 999,
        },
      ]);

      expect((data as any).poi).toEqual([
        {
          id: 1,
          name: 'TA Store',
          type: 'Polygon',
          coordinates: [[[100.5, 13.7]]],
          radius: 123,
          areaColor: undefined,
        },
      ]);

      expect(mockTradeareaRepository.findTradeareasForSearch).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          nation: 'TH',
          provCode: '10',
          ampCode: '1001',
          tamCode: '100101',
          status: 'active',
          approvalType: 'approved',
          tradeAreaType: 'A',
          searchKey: 'x',
        }),
        boundaryArea,
        2,
        0,
      );

      expect(mockTradeareaRepository.findTradeareasForSearch).toHaveBeenNthCalledWith(
        2,
        expect.any(Object),
        boundaryArea,
        1000,
        0,
      );
    });

    it('should propagate repository errors', async () => {
      const query = { type: SearchType.SEVEN_ELEVEN, limit: 10, page: 1 } as any;
      const error = new Error('db error');
      (mockPoiRepository.findSevenStore as any).mockRejectedValue(error);

      await expect(useCase.handler(query, mockJwtPayload)).rejects.toThrow(error);
      expect(mockPoiRepository.findSevenStore).toHaveBeenCalledTimes(1);
    });
  });
});
