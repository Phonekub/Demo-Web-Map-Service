import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  UpsertPoiAreaUseCase,
  Coordinate,
  UpsertPoiAreaRequest,
} from './upsertPoiArea.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { Poi, AreaShape as DomainAreaShape } from '../../../domain/poi';
import {
  AreaEntity,
  AreaShape as EntityAreaShape,
} from '../../../adapter/outbound/repositories/entities/area.entity';

describe('UpsertPoiAreaUseCase', () => {
  let useCase: UpsertPoiAreaUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;

  // Test data
  const mockPoi: Poi = {
    id: 1,
    uid: 'poi-uid-1',
    branchName: 'Test Branch',
    branchCode: 'TB001',
    location: '123 Test St, Test City',
    geom: {
      type: 'Point',
      coordinates: [100.5398, 13.7474], // Bangkok coordinates
    },
    area: {
      id: 1,
      coordinates: [
        [100.5398, 13.7474],
        [100.5399, 13.7474],
        [100.5399, 13.7475],
        [100.5398, 13.7475],
      ],
      shape: DomainAreaShape.Polygon,
    },
    layer: {
      id: 1,
      symbol: 'test-symbol',
    },
    status: 'active',
  };

  const mockArea: AreaEntity = {
    id: 1,
    name: 'Test Area',
    shape: EntityAreaShape.POLYGON,
    props: {},
    geom: 'POLYGON((100.5398 13.7474, 100.5399 13.7474, 100.5399 13.7475, 100.5398 13.7475, 100.5398 13.7474))',
    ownerPoiId: 1,
    ownerPoi: null, // Mock entity relationship is not needed for unit tests
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validCoordinates: Coordinate[] = [
    { lat: 13.7474, lng: 100.5398 }, // Center point
    { lat: 13.7475, lng: 100.5399 }, // ~100m away
    { lat: 13.7476, lng: 100.5398 }, // ~220m away
    { lat: 13.7474, lng: 100.5398 }, // Close polygon
  ];

  const validRequest: UpsertPoiAreaRequest = {
    poiId: 1,
    coordinates: validCoordinates,
    name: 'Test Area',
    props: { description: 'Test area description' },
  };

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findOverlappingAreas: jest.fn(),
      findAreaByPoiId: jest.fn(),
      createArea: jest.fn(),
      updateArea: jest.fn(),
      findPoiLocationByQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsertPoiAreaUseCase,
        {
          provide: 'PoiRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpsertPoiAreaUseCase>(UpsertPoiAreaUseCase);
    mockPoiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should successfully create a new area when all validations pass', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);
      mockPoiRepository.findOverlappingAreas.mockResolvedValue([]);
      mockPoiRepository.findAreaByPoiId.mockResolvedValue(null);
      mockPoiRepository.createArea.mockResolvedValue(mockArea);

      // Act
      const result = await useCase.handler(validRequest);

      // Assert
      expect(result).toEqual(mockArea);
      expect(mockPoiRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPoiRepository.findOverlappingAreas).toHaveBeenCalled();
      expect(mockPoiRepository.findAreaByPoiId).toHaveBeenCalledWith(1);
      expect(mockPoiRepository.createArea).toHaveBeenCalledWith({
        name: 'Test Area',
        shape: 'polygon',
        geom: expect.stringContaining('POLYGON'),
        ownerPoiId: 1,
        props: { description: 'Test area description' },
      });
    });

    it('should successfully update existing area', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);
      mockPoiRepository.findOverlappingAreas.mockResolvedValue([]);
      mockPoiRepository.findAreaByPoiId.mockResolvedValue(mockArea);
      mockPoiRepository.updateArea.mockResolvedValue({
        ...mockArea,
        name: 'Updated Area',
      });

      const updateRequest = { ...validRequest, name: 'Updated Area' };

      // Act
      const result = await useCase.handler(updateRequest);

      // Assert
      expect(result.name).toBe('Updated Area');
      expect(mockPoiRepository.updateArea).toHaveBeenCalledWith(1, {
        name: 'Updated Area',
        shape: 'polygon',
        geom: expect.stringContaining('POLYGON'),
        ownerPoiId: 1,
        props: { description: 'Test area description' },
      });
      expect(mockPoiRepository.createArea).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when POI is not found', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.handler(validRequest)).rejects.toThrow(
        new BadRequestException('POI with ID 1 not found'),
      );
      expect(mockPoiRepository.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('validateInput', () => {
    it('should throw BadRequestException for invalid POI ID', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, poiId: 0 };

      // Act & Assert
      await expect(useCase.handler(invalidRequest)).rejects.toThrow(
        new BadRequestException('Valid POI ID is required'),
      );
    });

    it('should throw BadRequestException for negative POI ID', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, poiId: -1 };

      // Act & Assert
      await expect(useCase.handler(invalidRequest)).rejects.toThrow(
        new BadRequestException('Valid POI ID is required'),
      );
    });

    it('should throw BadRequestException for insufficient coordinates', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        coordinates: [
          { lat: 13.7474, lng: 100.5398 },
          { lat: 13.7475, lng: 100.5399 },
        ], // Only 2 coordinates
      };

      // Act & Assert
      await expect(useCase.handler(invalidRequest)).rejects.toThrow(
        new BadRequestException('At least 3 coordinates are required to form a polygon'),
      );
    });

    it('should throw BadRequestException for invalid coordinate format', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);

      const invalidRequest = {
        ...validRequest,
        coordinates: [
          { lat: 13.7474, lng: 100.5398 },
          { lat: NaN, lng: 100.5399 }, // Invalid coordinate
          { lat: 13.7476, lng: 100.5398 },
        ],
      };

      // Act & Assert
      await expect(useCase.handler(invalidRequest)).rejects.toThrow(
        new BadRequestException('Invalid coordinate format. lat and lng must be numbers'),
      );
    });

    it('should throw BadRequestException for latitude out of range', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        coordinates: [
          { lat: 91, lng: 100.5398 }, // Invalid latitude > 90
          { lat: 13.7475, lng: 100.5399 },
          { lat: 13.7476, lng: 100.5398 },
        ],
      };

      // Act & Assert
      await expect(useCase.handler(invalidRequest)).rejects.toThrow(
        new BadRequestException('Latitude must be between -90 and 90'),
      );
    });

    it('should throw BadRequestException for longitude out of range', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        coordinates: [
          { lat: 13.7474, lng: 181 }, // Invalid longitude > 180
          { lat: 13.7475, lng: 100.5399 },
          { lat: 13.7476, lng: 100.5398 },
        ],
      };

      // Act & Assert
      await expect(useCase.handler(invalidRequest)).rejects.toThrow(
        new BadRequestException('Longitude must be between -180 and 180'),
      );
    });

    it('should auto-close polygon when first and last coordinates are different', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);
      mockPoiRepository.findOverlappingAreas.mockResolvedValue([]);
      mockPoiRepository.findAreaByPoiId.mockResolvedValue(null);
      mockPoiRepository.createArea.mockResolvedValue(mockArea);

      const openPolygonRequest = {
        ...validRequest,
        coordinates: [
          { lat: 13.7474, lng: 100.5398 },
          { lat: 13.7475, lng: 100.5399 },
          { lat: 13.7476, lng: 100.5398 },
          // Missing closing coordinate
        ],
      };

      // Act
      await useCase.handler(openPolygonRequest);

      // Assert
      expect(mockPoiRepository.createArea).toHaveBeenCalledWith(
        expect.objectContaining({
          geom: expect.stringContaining(
            '100.5398 13.7474, 100.5399 13.7475, 100.5398 13.7476, 100.5398 13.7474',
          ),
        }),
      );
    });
  });

  describe('validateDistanceFromCenter', () => {
    it('should throw BadRequestException when coordinate exceeds distance limit', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);

      const farCoordinates: Coordinate[] = [
        { lat: 13.7474, lng: 100.5398 }, // Center
        { lat: 13.7474, lng: 100.5399 }, // Close
        { lat: 13.77, lng: 100.5398 }, // ~2500m away (exceeds 2000m limit)
        { lat: 13.7474, lng: 100.5398 }, // Close polygon
      ];

      const farRequest = { ...validRequest, coordinates: farCoordinates };

      // Act & Assert
      await expect(useCase.handler(farRequest)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(farRequest)).rejects.toThrow(
        /exceeding the 600m limit/,
      );
    });

    it('should pass validation when all coordinates are within distance limit', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);
      mockPoiRepository.findOverlappingAreas.mockResolvedValue([]);
      mockPoiRepository.findAreaByPoiId.mockResolvedValue(null);
      mockPoiRepository.createArea.mockResolvedValue(mockArea);

      const nearCoordinates: Coordinate[] = [
        { lat: 13.7474, lng: 100.5398 }, // Center
        { lat: 13.755, lng: 100.545 }, // ~1000m away (within 2000m limit)
        { lat: 13.74, lng: 100.53 }, // ~1200m away (within 2000m limit)
        { lat: 13.7474, lng: 100.5398 }, // Close polygon
      ];

      const nearRequest = { ...validRequest, coordinates: nearCoordinates };

      // Act & Assert
      await expect(useCase.handler(nearRequest)).resolves.toBeDefined();
    });
  });

  describe('checkForOverlappingAreas', () => {
    it('should throw BadRequestException when areas overlap', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);

      const overlappingArea = { ...mockArea, ownerPoiId: 2 };
      mockPoiRepository.findOverlappingAreas.mockResolvedValue([overlappingArea]);

      // Act & Assert
      await expect(useCase.handler(validRequest)).rejects.toThrow(
        new BadRequestException(
          'Area polygon overlaps with existing areas from POI(s): 2',
        ),
      );
    });

    it('should throw BadRequestException when multiple areas overlap', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);

      const overlappingAreas = [
        { ...mockArea, ownerPoiId: 2 },
        { ...mockArea, ownerPoiId: 3 },
      ];
      mockPoiRepository.findOverlappingAreas.mockResolvedValue(overlappingAreas);

      // Act & Assert
      await expect(useCase.handler(validRequest)).rejects.toThrow(
        new BadRequestException(
          'Area polygon overlaps with existing areas from POI(s): 2, 3',
        ),
      );
    });

    it('should pass validation when no overlapping areas exist', async () => {
      // Arrange
      mockPoiRepository.findById.mockResolvedValue(mockPoi);
      mockPoiRepository.findOverlappingAreas.mockResolvedValue([]);
      mockPoiRepository.findAreaByPoiId.mockResolvedValue(null);
      mockPoiRepository.createArea.mockResolvedValue(mockArea);

      // Act & Assert
      await expect(useCase.handler(validRequest)).resolves.toBeDefined();
    });
  });

  // Note: Private methods are tested through integration tests above
  // as they are called internally by the public handler method
});
