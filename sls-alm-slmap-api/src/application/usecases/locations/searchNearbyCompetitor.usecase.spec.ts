import { Test, TestingModule } from '@nestjs/testing';
import { SearchNearbyCompetitorUseCase } from './searchNearbyCompetitor.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';

describe('SearchNearbyCompetitorUseCase', () => {
  let useCase: SearchNearbyCompetitorUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<PoiRepositoryPort>> = {
      findCompetitorNearby: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchNearbyCompetitorUseCase,
        {
          provide: 'PoiRepository',
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<SearchNearbyCompetitorUseCase>(SearchNearbyCompetitorUseCase);
    mockPoiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call repository.findCompetitorNearby with lat/long/distance, empty boundaryArea, limit=100, offset=0 and return [results,total]', async () => {
      // Arrange
      const query = {
        lat: 13.7563,
        long: 100.5018,
        distance: 500,
      } as any;

      const mockPois = [
        {
          id: 1,
          uid: 'C-001',
          branchName: 'Competitor A',
          geom: { type: 'Point', coordinates: [100.5018, 13.7563] },
        },
        {
          id: 2,
          uid: 'C-002',
          branchName: 'Competitor B',
          geom: { type: 'Point', coordinates: [100.51, 13.76] },
        },
      ] as any;

      mockPoiRepository.findCompetitorNearby.mockResolvedValue([mockPois, 2] as any);

      // Act
      const result = await useCase.handler(query);

      // Assert
      expect(mockPoiRepository.findCompetitorNearby).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findCompetitorNearby).toHaveBeenCalledWith(
        query.lat,
        query.long,
        query.distance,
        [],
        100,
        0,
      );
      expect(result).toEqual([mockPois, 2]);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const query = { lat: 1, long: 2, distance: 3 } as any;
      const error = new Error('db error');

      mockPoiRepository.findCompetitorNearby.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.handler(query)).rejects.toThrow(error);
      expect(mockPoiRepository.findCompetitorNearby).toHaveBeenCalledTimes(1);
    });
  });
});
