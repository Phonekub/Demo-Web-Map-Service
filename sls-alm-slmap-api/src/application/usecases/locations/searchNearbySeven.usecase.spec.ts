import { Test, TestingModule } from '@nestjs/testing';
import { SearchNearbySevenUseCase } from './searchNearbySeven.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { NearbySearchQuery } from '../../../adapter/inbound/dtos/search.dto';

describe('SearchNearbySevenUseCase', () => {
  let useCase: SearchNearbySevenUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<PoiRepositoryPort>> = {
      findSevenElevenNearby: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchNearbySevenUseCase,
        {
          provide: 'PoiRepository',
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<SearchNearbySevenUseCase>(SearchNearbySevenUseCase);
    mockPoiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call repository.findSevenElevenNearby with expected params and return [results, total]', async () => {
      // Arrange
      const query: NearbySearchQuery = {
        lat: 13.7563,
        long: 100.5018,
        distance: 1000,
      } as any;

      const mockResults = [
        {
          id: 1,
          uid: 'S-001',
          branchName: '7-11 Test 1',
          geom: { type: 'Point', coordinates: [100.5018, 13.7563] },
        },
      ];

      mockPoiRepository.findSevenElevenNearby.mockResolvedValue([mockResults as any, 1]);

      // Act
      const result = await useCase.handler(query);

      // Assert
      expect(mockPoiRepository.findSevenElevenNearby).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findSevenElevenNearby).toHaveBeenCalledWith(
        query.lat,
        query.long,
        query.distance,
        [], // boundaryArea
        100, // limit
        0, // offset
      );
      expect(result).toEqual([mockResults, 1]);
    });

    it('should return empty results when repository returns empty', async () => {
      // Arrange
      const query: NearbySearchQuery = {
        lat: 0,
        long: 0,
        distance: 0,
      } as any;

      mockPoiRepository.findSevenElevenNearby.mockResolvedValue([[] as any, 0]);

      // Act
      const result = await useCase.handler(query);

      // Assert
      expect(result).toEqual([[], 0]);
      expect(mockPoiRepository.findSevenElevenNearby).toHaveBeenCalledWith(
        0,
        0,
        0,
        [],
        100,
        0,
      );
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const query: NearbySearchQuery = {
        lat: 13.7,
        long: 100.5,
        distance: 500,
      } as any;

      const error = new Error('db error');
      mockPoiRepository.findSevenElevenNearby.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.handler(query)).rejects.toThrow(error);
      expect(mockPoiRepository.findSevenElevenNearby).toHaveBeenCalledTimes(1);
    });
  });
});
