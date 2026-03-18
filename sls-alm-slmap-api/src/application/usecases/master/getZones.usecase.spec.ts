import { GetZonesUseCase } from './getZones.usecase';
import { ZoneMaster } from '../../../domain/zoneMaster';

describe('GetZonesUseCase', () => {
  let mockRepo: any;
  let usecase: GetZonesUseCase;

  beforeEach(() => {
    mockRepo = {
      getZones: jest.fn(),
    };
    usecase = new GetZonesUseCase(mockRepo);
  });

  describe('handler', () => {
    it('should return zones when repository returns data with orgId and category', async () => {
      // Arrange
      const mockZones: ZoneMaster[] = [
        { zoneId: 43, zoneCode: 'BE', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 41, zoneCode: 'BG', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 42, zoneCode: 'BN', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 44, zoneCode: 'BS', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 45, zoneCode: 'BW', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 60, zoneCode: 'NEL', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 59, zoneCode: 'NEU', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 48, zoneCode: 'RC', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 62, zoneCode: 'REL', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 61, zoneCode: 'REU', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 56, zoneCode: 'RN', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 53, zoneCode: 'RSL', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 52, zoneCode: 'RSU', category: 'MAIN', region: 'PROVINCE' },
      ];
      mockRepo.getZones.mockResolvedValue(mockZones);

      // Act
      const result = await usecase.handler('2', 'MAIN');

      // Assert
      expect(mockRepo.getZones).toHaveBeenCalledWith('2', 'MAIN');
      expect(result).toEqual(mockZones);
      expect(result).toHaveLength(13);
      expect(result[0].zoneCode).toBe('BE');
    });

    it('should return zones when repository returns data with only orgId', async () => {
      // Arrange
      const mockZones: ZoneMaster[] = [
        { zoneId: 43, zoneCode: 'BE', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 41, zoneCode: 'BG', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 60, zoneCode: 'NEL', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 48, zoneCode: 'RC', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 56, zoneCode: 'RN', category: 'MAIN', region: 'PROVINCE' },
      ];
      mockRepo.getZones.mockResolvedValue(mockZones);

      // Act
      const result = await usecase.handler('2');

      // Assert
      expect(mockRepo.getZones).toHaveBeenCalledWith('2', undefined);
      expect(result).toEqual(mockZones);
      expect(result).toHaveLength(5);
    });

    it('should return empty array when no zones found', async () => {
      // Arrange
      mockRepo.getZones.mockResolvedValue([]);

      // Act
      const result = await usecase.handler('999', 'MAIN');

      // Assert
      expect(mockRepo.getZones).toHaveBeenCalledWith('999', 'MAIN');
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockRepo.getZones.mockRejectedValue(error);

      // Act & Assert
      await expect(usecase.handler('2', 'MAIN')).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockRepo.getZones).toHaveBeenCalledWith('2', 'MAIN');
    });
  });
});
