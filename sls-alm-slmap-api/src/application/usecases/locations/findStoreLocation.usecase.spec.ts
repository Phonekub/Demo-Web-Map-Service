import { Test, TestingModule } from '@nestjs/testing';
import { FindStoreLocationUseCase } from './findStoreLocation.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';

describe('FindStoreLocationUseCase', () => {
  let useCase: FindStoreLocationUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<PoiRepositoryPort>> = {
      findPoiLocationByQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindStoreLocationUseCase,
        {
          provide: 'PoiRepository',
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<FindStoreLocationUseCase>(FindStoreLocationUseCase);
    mockPoiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call repository.findPoiLocationByQuery with the provided query and return result', async () => {
      // Arrange
      const query = 'บางกอก';
      const expectedResult = [
        { id: 1, name: 'Store A', location: 'Bangkok' },
        { id: 2, name: 'Store B', location: 'Bangkok' },
      ];

      mockPoiRepository.findPoiLocationByQuery.mockResolvedValue(expectedResult as any);

      // Act
      const result = await useCase.handler(query);

      // Assert
      expect(mockPoiRepository.findPoiLocationByQuery).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findPoiLocationByQuery).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const query = 'test';
      const error = new Error('db error');

      mockPoiRepository.findPoiLocationByQuery.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.handler(query)).rejects.toThrow(error);
      expect(mockPoiRepository.findPoiLocationByQuery).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findPoiLocationByQuery).toHaveBeenCalledWith(query);
    });
  });
});
