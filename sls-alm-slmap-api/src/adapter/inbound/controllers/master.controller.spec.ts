import { MasterController } from './master.controller';
import { GetZonesUseCase } from '../../../application/usecases/master/getZones.usecase';
import { GetZonesDto } from '../dtos/getZones.dto';
import { ZoneMaster } from '../../../domain/zoneMaster';

describe('MasterController - getZones', () => {
  let controller: MasterController;
  let mockGetZonesUseCase: jest.Mocked<GetZonesUseCase>;

  beforeEach(() => {
    // Create mock use cases
    mockGetZonesUseCase = {
      handler: jest.fn(),
    } as any;

    // Create controller with mocked dependencies
    controller = new MasterController(
      null as any, // getProvincesUseCase
      null as any, // getDistrictsUseCase
      null as any, // getSubDistrictsUseCase
      null as any, // getCommonCodeUseCase
      null as any, // getLayersUseCase
      null as any, // getTradeareaConfigsUseCase
      null as any, // getImportConfigUseCase
      null as any, // getAllRolesUseCase
      null as any, // getPermissionsUseCase
      mockGetZonesUseCase,
    );
  });

  describe('getZones', () => {
    it('should return zones data when usecase succeeds with orgId and category', async () => {
      // Arrange
      const query: GetZonesDto = {
        orgId: '2',
        category: 'MAIN',
      };
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
      mockGetZonesUseCase.handler.mockResolvedValue(mockZones);

      // Act
      const result = await controller.getZones(query);

      // Assert
      expect(mockGetZonesUseCase.handler).toHaveBeenCalledWith('2', 'MAIN');
      expect(result).toEqual({ data: mockZones });
    });

    it('should return zones data when usecase succeeds with only orgId', async () => {
      // Arrange
      const query: GetZonesDto = {
        orgId: '2',
      };
      const mockZones: ZoneMaster[] = [
        { zoneId: 43, zoneCode: 'BE', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 41, zoneCode: 'BG', category: 'MAIN', region: 'BANGKOK' },
        { zoneId: 60, zoneCode: 'NEL', category: 'MAIN', region: 'PROVINCE' },
        { zoneId: 48, zoneCode: 'RC', category: 'MAIN', region: 'PROVINCE' },
      ];
      mockGetZonesUseCase.handler.mockResolvedValue(mockZones);

      // Act
      const result = await controller.getZones(query);

      // Assert
      expect(mockGetZonesUseCase.handler).toHaveBeenCalledWith('2', undefined);
      expect(result).toEqual({ data: mockZones });
    });

    it('should return empty data array when no zones found', async () => {
      // Arrange
      const query: GetZonesDto = {
        orgId: '999',
        category: 'MAIN',
      };
      mockGetZonesUseCase.handler.mockResolvedValue([]);

      // Act
      const result = await controller.getZones(query);

      // Assert
      expect(mockGetZonesUseCase.handler).toHaveBeenCalledWith('999', 'MAIN');
      expect(result).toEqual({ data: [] });
    });

    it('should throw error when usecase fails', async () => {
      // Arrange
      const query: GetZonesDto = {
        orgId: '2',
        category: 'MAIN',
      };
      const error = new Error('Database error');
      mockGetZonesUseCase.handler.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getZones(query)).rejects.toThrow('Database error');
      expect(mockGetZonesUseCase.handler).toHaveBeenCalledWith('2', 'MAIN');
    });
  });
});
