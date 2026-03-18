import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { SearchPoiUseCase } from '../../../application/usecases/locations/searchPoi.usecase';
import { SpatialSearchUseCase } from '../../../application/usecases/locations/spatialSearch.usecase';
import { UpsertPoiAreaUseCase } from '../../../application/usecases/locations/upsertPoiArea.usecase';
import { CreatePoiUseCase } from '../../../application/usecases/locations/createPoi.usecase';
import { UpdatePoiUseCase } from '../../../application/usecases/locations/updatePoi.usecase';
import { GetCoordinateInfoUseCase } from '../../../application/usecases/locations/getCoordinateInfo.usecase';
import { SearchNearbySevenUseCase } from '../../../application/usecases/locations/searchNearbySeven.usecase';
import { SearchNearbyCompetitorUseCase } from '../../../application/usecases/locations/searchNearbyCompetitor.usecase';
import { SearchNearbyEntertainmentAreaUseCase } from '../../../application/usecases/locations/searchNearbyEntertainmentArea.usecase';
import { SearchCompetitorSurroundUseCase } from '../../../application/usecases/locations/searchCompetitorSurround.usecase';
import { GetPoiByIdUseCase } from '../../../application/usecases/locations/getPoiById.usecase';
import { Poi } from '../../../domain/poi';
import { CustomRequest } from '../interfaces/requests/customRequest';

describe('LocationController', () => {
  let controller: LocationController;
  let mockGetPoiByIdUseCase: jest.Mocked<GetPoiByIdUseCase>;

  const mockUserZoneCodes = {
    Z001: ['SZ001', 'SZ002'],
  };

  const mockRequest = {
    user: {
      id: 1,
      zoneCodes: mockUserZoneCodes,
    },
  } as unknown as CustomRequest;

  const mockPoi: Partial<Poi> = {
    id: 1,
    uid: 'POI-001',
    branchName: 'Test Branch',
    branchCode: 'TB001',
    location: 'Test Location',
    geom: {
      type: 'Point',
      coordinates: [100.5, 13.7],
    },
  };

  beforeEach(async () => {
    const mockSearchPoiUseCase = { handler: jest.fn() };
    const mockSpatialSearchUseCase = { handler: jest.fn() };
    const mockUpsertPoiAreaUseCase = { handler: jest.fn() };
    const mockCreatePoiUseCase = { handler: jest.fn() };
    const mockUpdatePoiUseCase = { handler: jest.fn() };
    const mockGetCoordinateInfoUseCase = { handler: jest.fn() };
    const mockSearchNearbySevenUseCase = { handler: jest.fn() };
    const mockSearchNearbyCompetitorUseCase = { handler: jest.fn() };
    const mockSearchNearbyEntertainmentAreaUseCase = { handler: jest.fn() };
    const mockSearchCompetitorSurroundUseCase = { handler: jest.fn() };
    const mockGetPoiByIdUseCaseObj = { handler: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: SearchPoiUseCase,
          useValue: mockSearchPoiUseCase,
        },
        {
          provide: SpatialSearchUseCase,
          useValue: mockSpatialSearchUseCase,
        },
        {
          provide: UpsertPoiAreaUseCase,
          useValue: mockUpsertPoiAreaUseCase,
        },
        {
          provide: CreatePoiUseCase,
          useValue: mockCreatePoiUseCase,
        },
        {
          provide: UpdatePoiUseCase,
          useValue: mockUpdatePoiUseCase,
        },
        {
          provide: GetCoordinateInfoUseCase,
          useValue: mockGetCoordinateInfoUseCase,
        },
        {
          provide: SearchNearbySevenUseCase,
          useValue: mockSearchNearbySevenUseCase,
        },
        {
          provide: SearchNearbyCompetitorUseCase,
          useValue: mockSearchNearbyCompetitorUseCase,
        },
        {
          provide: SearchNearbyEntertainmentAreaUseCase,
          useValue: mockSearchNearbyEntertainmentAreaUseCase,
        },
        {
          provide: SearchCompetitorSurroundUseCase,
          useValue: mockSearchCompetitorSurroundUseCase,
        },
        {
          provide: GetPoiByIdUseCase,
          useValue: mockGetPoiByIdUseCaseObj,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    mockGetPoiByIdUseCase = module.get(GetPoiByIdUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPoiById', () => {
    it('should return POI data wrapped in data object when successful', async () => {
      // Arrange
      mockGetPoiByIdUseCase.handler.mockResolvedValue(mockPoi as Poi);

      // Act
      const result = await controller.getPoiById(1, mockRequest);

      // Assert
      expect(result).toEqual({
        data: mockPoi,
      });
      expect(mockGetPoiByIdUseCase.handler).toHaveBeenCalledWith(1, mockUserZoneCodes);
    });

    it('should pass the correct ID and zoneCodes to the use case', async () => {
      // Arrange
      mockGetPoiByIdUseCase.handler.mockResolvedValue(mockPoi as Poi);

      // Act
      await controller.getPoiById(123, mockRequest);

      // Assert
      expect(mockGetPoiByIdUseCase.handler).toHaveBeenCalledWith(123, mockUserZoneCodes);
    });

    it('should propagate errors from the use case', async () => {
      // Arrange
      const error = new Error('POI not found');
      mockGetPoiByIdUseCase.handler.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getPoiById(999, mockRequest)).rejects.toThrow(
        'POI not found',
      );
    });
  });
});
