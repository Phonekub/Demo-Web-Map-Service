import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GetPoiByIdUseCase } from './getPoiById.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { AreaShape, Poi } from '../../../domain/poi';

describe('GetPoiByIdUseCase', () => {
  let useCase: GetPoiByIdUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;

  const mockAccessArea: Record<string, string[]> = {
    Z001: ['SZ001', 'SZ002'],
    Z002: ['SZ003', 'SZ004'],
  };

  const mockBoundaryArea: [string, string][] = [
    ['Z001', 'SZ001'],
    ['Z001', 'SZ002'],
    ['Z002', 'SZ003'],
    ['Z002', 'SZ004'],
  ];

  const mockPoiDomain: Poi = {
    id: 1,
    uid: 'POI-001',
    branchName: 'Test Branch',
    branchCode: 'BR001',
    location: 'Test Location',
    geom: {
      type: 'Point',
      coordinates: [100.5, 13.7],
    },
    area: {
      id: 1,
      coordinates: [
        [100.5, 13.7],
        [100.6, 13.7],
        [100.6, 13.8],
        [100.5, 13.8],
        [100.5, 13.7],
      ],
      shape: AreaShape.Polygon,
    },
    layerId: 1,
    layerName: 'Test Layer',
    layer: {
      id: 1,
      symbol: 'test-symbol',
    },
    status: 'active',
  };

  beforeEach(async () => {
    const mockPoiRepo = {
      findPoiById: jest.fn(),
      findPoiWithZoneById: jest.fn(),
      findById: jest.fn(),
      findPoiLocationByQuery: jest.fn(),
      findZoneAndSubZoneByCoordinate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPoiByIdUseCase,
        {
          provide: 'PoiRepository',
          useValue: mockPoiRepo,
        },
      ],
    }).compile();

    useCase = module.get<GetPoiByIdUseCase>(GetPoiByIdUseCase);
    mockPoiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should return POI domain when ID is valid and POI is found', async () => {
      // Arrange
      mockPoiRepository.findPoiById.mockResolvedValue(mockPoiDomain);

      // Act
      const result = await useCase.handler(1, mockAccessArea);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.uid).toBe('POI-001');
      expect(mockPoiRepository.findPoiById).toHaveBeenCalledWith(1, mockBoundaryArea);
    });

    it('should throw BadRequestException when POI ID is invalid (zero)', async () => {
      // Arrange & Act & Assert
      await expect(useCase.handler(0, mockAccessArea)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.handler(0, mockAccessArea)).rejects.toThrow('Invalid POI ID');
      expect(mockPoiRepository.findPoiById).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when POI ID is invalid (negative)', async () => {
      // Arrange & Act & Assert
      await expect(useCase.handler(-1, mockAccessArea)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.handler(-1, mockAccessArea)).rejects.toThrow('Invalid POI ID');
      expect(mockPoiRepository.findPoiById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when POI is not found', async () => {
      // Arrange
      mockPoiRepository.findPoiById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.handler(999, mockAccessArea)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.handler(999, mockAccessArea)).rejects.toThrow(
        'POI with ID 999 not found',
      );
      expect(mockPoiRepository.findPoiById).toHaveBeenCalledWith(999, mockBoundaryArea);
    });

    it('should return empty object when accessArea is empty', async () => {
      // Arrange
      const emptyAccessArea: Record<string, string[]> = {};

      // Act
      const result = await useCase.handler(1, emptyAccessArea);

      // Assert
      expect(result).toEqual({});
      expect(mockPoiRepository.findPoiById).not.toHaveBeenCalled();
    });

    it('should handle POI with single zone access', async () => {
      // Arrange
      const singleZoneAccess: Record<string, string[]> = {
        Z001: ['SZ001'],
      };
      const expectedBoundaryArea: [string, string][] = [['Z001', 'SZ001']];
      mockPoiRepository.findPoiById.mockResolvedValue(mockPoiDomain);

      // Act
      const result = await useCase.handler(1, singleZoneAccess);

      // Assert
      expect(result).toBeDefined();
      expect(mockPoiRepository.findPoiById).toHaveBeenCalledWith(1, expectedBoundaryArea);
    });

    it('should correctly transform accessArea to boundaryArea', async () => {
      // Arrange
      const accessArea: Record<string, string[]> = {
        ZONE_A: ['SUB_1', 'SUB_2'],
        ZONE_B: ['SUB_3'],
      };
      const expectedBoundaryArea: [string, string][] = [
        ['ZONE_A', 'SUB_1'],
        ['ZONE_A', 'SUB_2'],
        ['ZONE_B', 'SUB_3'],
      ];
      mockPoiRepository.findPoiById.mockResolvedValue(mockPoiDomain);

      // Act
      await useCase.handler(1, accessArea);

      // Assert
      expect(mockPoiRepository.findPoiById).toHaveBeenCalledWith(1, expectedBoundaryArea);
    });
  });
});
