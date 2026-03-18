import { Test, TestingModule } from '@nestjs/testing';
import { GetCoordinateInfoUseCase } from './getCoordinateInfo.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import * as userHelper from '../../../common/helpers/user.helper';

describe('GetCoordinateInfoUseCase', () => {
  let useCase: GetCoordinateInfoUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;
  let mockMasterRepository: jest.Mocked<MasterRepositoryPort>;
  let userZoneAndSubZoneAuthorizationSpy: jest.SpyInstance;

  const mockUserZoneCodes = {
    Z001: ['SZ001', 'SZ002'],
    Z002: ['SZ003', 'SZ004'],
  };

  const mockSubDistrict = [
    {
      value: '100101001',
      text: 'Phra Borom Maha Ratchawang',
    },
  ];

  const mockDistrict = {
    value: '100101',
    text: 'Phra Nakhon',
  };

  const mockProvince = {
    value: '1001',
    text: 'Bangkok',
  };

  const mockPoiZone = {
    id: 1,
    zone: 'Z001',
    subzone: 'SZ001',
    shape: {
      type: 'Polygon',
      coordinates: [
        [
          [100.5, 13.7],
          [100.6, 13.7],
          [100.6, 13.8],
          [100.5, 13.8],
          [100.5, 13.7],
        ],
      ],
    },
  };

  beforeEach(async () => {
    const mockPoiRepo = {
      findZoneAndSubZoneByCoordinate: jest.fn(),
      findById: jest.fn(),
      findPoiLocationByQuery: jest.fn(),
    };

    const mockMasterRepo = {
      getSubDistricts: jest.fn(),
      getOneDistrict: jest.fn(),
      getOneProvince: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCoordinateInfoUseCase,
        {
          provide: 'PoiRepository',
          useValue: mockPoiRepo,
        },
        {
          provide: 'MasterRepository',
          useValue: mockMasterRepo,
        },
      ],
    }).compile();

    useCase = module.get<GetCoordinateInfoUseCase>(GetCoordinateInfoUseCase);
    mockPoiRepository = module.get('PoiRepository');
    mockMasterRepository = module.get('MasterRepository');

    // Spy on the helper function
    userZoneAndSubZoneAuthorizationSpy = jest.spyOn(
      userHelper,
      'userZoneAndSubZoneAuthorization',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should return coordinate info with authorized zone when all data is valid', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;

      mockMasterRepository.getSubDistricts.mockResolvedValue(mockSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);
      mockPoiRepository.findZoneAndSubZoneByCoordinate.mockResolvedValue(mockPoiZone);
      userZoneAndSubZoneAuthorizationSpy.mockReturnValue(true);

      // Act
      const result = await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(result).toEqual({
        zoneAuthorized: true,
        zone: 'Z001',
        subzone: 'SZ001',
        subDistrict: {
          text: 'Phra Borom Maha Ratchawang',
          code: '100101001',
        },
        district: {
          text: 'Phra Nakhon',
          code: '100101',
        },
        province: {
          text: 'Phra Nakhon',
          code: '100101',
        },
      });

      expect(mockMasterRepository.getSubDistricts).toHaveBeenCalledWith({
        coordinate: { latitude, longitude },
      });
      expect(mockMasterRepository.getOneDistrict).toHaveBeenCalledWith('100101');
      expect(mockMasterRepository.getOneProvince).toHaveBeenCalledWith('1001');
      expect(mockPoiRepository.findZoneAndSubZoneByCoordinate).toHaveBeenCalledWith(
        latitude,
        longitude,
      );
      expect(userZoneAndSubZoneAuthorizationSpy).toHaveBeenCalledWith(mockUserZoneCodes, {
        zoneCode: 'Z001',
        subzoneCode: 'SZ001',
      });
    });

    it('should return coordinate info with unauthorized zone when user lacks permission', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;

      mockMasterRepository.getSubDistricts.mockResolvedValue(mockSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);
      mockPoiRepository.findZoneAndSubZoneByCoordinate.mockResolvedValue(mockPoiZone);
      userZoneAndSubZoneAuthorizationSpy.mockReturnValue(false);

      // Act
      const result = await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(result).toEqual({
        zoneAuthorized: false,
        zone: 'Z001',
        subzone: 'SZ001',
        subDistrict: {
          text: 'Phra Borom Maha Ratchawang',
          code: '100101001',
        },
        district: {
          text: 'Phra Nakhon',
          code: '100101',
        },
        province: {
          text: 'Phra Nakhon',
          code: '100101',
        },
      });
    });

    it('should return null when subDistrict array is empty', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;

      mockMasterRepository.getSubDistricts.mockResolvedValue([]);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);

      // Act
      const result = await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(result).toBeNull();
      expect(mockPoiRepository.findZoneAndSubZoneByCoordinate).not.toHaveBeenCalled();
      expect(userZoneAndSubZoneAuthorizationSpy).not.toHaveBeenCalled();
    });

    it('should return null when district is null', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;

      mockMasterRepository.getSubDistricts.mockResolvedValue(mockSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(null);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);

      // Act
      const result = await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(result).toBeNull();
      expect(mockPoiRepository.findZoneAndSubZoneByCoordinate).not.toHaveBeenCalled();
    });

    it('should return null when province is null', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;

      mockMasterRepository.getSubDistricts.mockResolvedValue(mockSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(null);

      // Act
      const result = await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(result).toBeNull();
      expect(mockPoiRepository.findZoneAndSubZoneByCoordinate).not.toHaveBeenCalled();
    });

    it('should return null when poiZone is null', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;

      mockMasterRepository.getSubDistricts.mockResolvedValue(mockSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);
      mockPoiRepository.findZoneAndSubZoneByCoordinate.mockResolvedValue(null);

      // Act
      const result = await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(result).toBeNull();
      expect(userZoneAndSubZoneAuthorizationSpy).not.toHaveBeenCalled();
    });

    it('should correctly extract district code from subDistrict code', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;
      const customSubDistrict = [
        {
          value: '123456789',
          text: 'Custom Sub District',
        },
      ];

      mockMasterRepository.getSubDistricts.mockResolvedValue(customSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);
      mockPoiRepository.findZoneAndSubZoneByCoordinate.mockResolvedValue(mockPoiZone);
      userZoneAndSubZoneAuthorizationSpy.mockReturnValue(true);

      // Act
      await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(mockMasterRepository.getOneDistrict).toHaveBeenCalledWith('123456');
    });

    it('should correctly extract province code from subDistrict code', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;
      const customSubDistrict = [
        {
          value: '987654321',
          text: 'Custom Sub District',
        },
      ];

      mockMasterRepository.getSubDistricts.mockResolvedValue(customSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);
      mockPoiRepository.findZoneAndSubZoneByCoordinate.mockResolvedValue(mockPoiZone);
      userZoneAndSubZoneAuthorizationSpy.mockReturnValue(true);

      // Act
      await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(mockMasterRepository.getOneProvince).toHaveBeenCalledWith('9876');
    });

    it('should handle different zone and subzone values', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;
      const differentPoiZone = {
        id: 2,
        zone: 'Z002',
        subzone: 'SZ003',
        shape: {
          type: 'Polygon',
          coordinates: [
            [
              [100.5, 13.7],
              [100.6, 13.7],
              [100.6, 13.8],
              [100.5, 13.8],
              [100.5, 13.7],
            ],
          ],
        },
      };

      mockMasterRepository.getSubDistricts.mockResolvedValue(mockSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);
      mockPoiRepository.findZoneAndSubZoneByCoordinate.mockResolvedValue(
        differentPoiZone,
      );
      userZoneAndSubZoneAuthorizationSpy.mockReturnValue(true);

      // Act
      const result = await useCase.handler(mockUserZoneCodes, latitude, longitude);

      // Assert
      expect(result).toEqual({
        zoneAuthorized: true,
        zone: 'Z002',
        subzone: 'SZ003',
        subDistrict: {
          text: 'Phra Borom Maha Ratchawang',
          code: '100101001',
        },
        district: {
          text: 'Phra Nakhon',
          code: '100101',
        },
        province: {
          text: 'Phra Nakhon',
          code: '100101',
        },
      });
      expect(userZoneAndSubZoneAuthorizationSpy).toHaveBeenCalledWith(mockUserZoneCodes, {
        zoneCode: 'Z002',
        subzoneCode: 'SZ003',
      });
    });

    it('should handle empty userZoneCodes', async () => {
      // Arrange
      const latitude = 13.7563;
      const longitude = 100.5018;
      const emptyUserZoneCodes = {};

      mockMasterRepository.getSubDistricts.mockResolvedValue(mockSubDistrict);
      mockMasterRepository.getOneDistrict.mockResolvedValue(mockDistrict);
      mockMasterRepository.getOneProvince.mockResolvedValue(mockProvince);
      mockPoiRepository.findZoneAndSubZoneByCoordinate.mockResolvedValue(mockPoiZone);
      userZoneAndSubZoneAuthorizationSpy.mockReturnValue(false);

      // Act
      const result = await useCase.handler(emptyUserZoneCodes, latitude, longitude);

      // Assert
      expect(result).toEqual({
        zoneAuthorized: false,
        zone: 'Z001',
        subzone: 'SZ001',
        subDistrict: {
          text: 'Phra Borom Maha Ratchawang',
          code: '100101001',
        },
        district: {
          text: 'Phra Nakhon',
          code: '100101',
        },
        province: {
          text: 'Phra Nakhon',
          code: '100101',
        },
      });
    });
  });
});
