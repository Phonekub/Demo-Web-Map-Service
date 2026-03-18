import { Test, TestingModule } from '@nestjs/testing';
import { SearchNearbyEntertainmentAreaUseCase } from './searchNearbyEntertainmentArea.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';

describe('SearchNearbyEntertainmentAreaUseCase', () => {
  let useCase: SearchNearbyEntertainmentAreaUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<PoiRepositoryPort>> = {
      findEntertainmentAreaNearby: jest.fn(),
      // some other usecases in this folder include this method in their mock shape
      // (not used here, but keeping it avoids token mismatch if the port is expanded)
      findPoiLocationByQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchNearbyEntertainmentAreaUseCase,
        {
          provide: 'PoiRepository',
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<SearchNearbyEntertainmentAreaUseCase>(
      SearchNearbyEntertainmentAreaUseCase,
    );
    mockPoiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call repository.findEntertainmentAreaNearby with expected params and return [data, total]', async () => {
      // Arrange
      const query = {
        lat: 13.7563,
        long: 100.5018,
        distance: 1500,
      } as any;

      const expectedData = [
        {
          id: 1,
          uid: 'EA-001',
          branchName: 'Entertainment Area 1',
          geom: { type: 'Point', coordinates: [100.5, 13.7] },
        },
      ];

      mockPoiRepository.findEntertainmentAreaNearby.mockResolvedValue([
        expectedData as any,
        1,
      ]);

      // Act
      const result = await useCase.handler(query);

      // Assert
      expect(mockPoiRepository.findEntertainmentAreaNearby).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findEntertainmentAreaNearby).toHaveBeenCalledWith(
        query.lat,
        query.long,
        query.distance,
        [], // boundaryArea should be empty for this usecase
        100, // limit
        0, // offset
      );
      expect(result).toEqual([expectedData, 1]);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const query = {
        lat: 13.1,
        long: 100.2,
        distance: 500,
      } as any;

      const error = new Error('db error');
      mockPoiRepository.findEntertainmentAreaNearby.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.handler(query)).rejects.toThrow(error);
      expect(mockPoiRepository.findEntertainmentAreaNearby).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findEntertainmentAreaNearby).toHaveBeenCalledWith(
        query.lat,
        query.long,
        query.distance,
        [],
        100,
        0,
      );
    });
  });
});
