import { Test, TestingModule } from '@nestjs/testing';
import { GetBackupProfileUseCase } from './getBackupProfile.usecase';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { BackupProfile } from '../../../domain/backupProfile';
import { NotFoundException } from '@nestjs/common';

describe('GetBackupProfileUseCase', () => {
  let useCase: GetBackupProfileUseCase;
  let repository: BackupProfileRepositoryPort;

  const mockBackupProfile: BackupProfile = {
    id: 1,
    uid: 'ec968f0d-1234-5678-9abc-def012345678',
    poiLayerId: 1,
    poiId: 1034,
    formLocNumber: 'FORM001',
    zoneCode: 'Z001',
    shape: 'POLYGON((100.5 13.7, 100.6 13.7, 100.6 13.8, 100.5 13.8, 100.5 13.7))',
    backupColor: 2,
    backupColorLayer: '#FF5733',
    isActive: 'Y',
    mainProfile: 'Main Profile 1',
    subProfile: 'Sub Profile 1',
    areaSize: 100.5,
    backupRemark: 'Test remark',
    strategicLocation: '01',
    strategicSupport: 'Support 1',
    strategicPlace: 'Place 1',
    strategicPlaceOther: null,
    strategicPlaceName: 'Place Name 1',
    strategicPlaceGuid: 'guid-123',
    strategicPosition: 'Position 1',
    strategicPositionOther: null,
    strategicPositionName: 'Position Name 1',
    strategicFloor: '1',
    strategicFloorOther: null,
    strategicCustomerType: 'Customer Type 1',
    strategicHousingType: 'Housing Type 1',
    strategicIndustrialEstateName: 'Estate Name 1',
    streetFood: '{10, 5, 10}',
    profiles: [],
    profilePois: [],
    competitors: [],
    createDate: new Date(),
    createBy: 1,
    updateDate: new Date(),
    updateBy: 1,
  };

  const mockBackupProfileRepository = {
    getBackupProfileByPoiId: jest.fn(),
    findByUid: jest.fn(),
    findByPoiId: jest.fn(),
    createBackupProfile: jest.fn(),
    updateBackupProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBackupProfileUseCase,
        {
          provide: 'BackupProfileRepository',
          useValue: mockBackupProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetBackupProfileUseCase>(GetBackupProfileUseCase);
    repository = module.get<BackupProfileRepositoryPort>('BackupProfileRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should return backup profile when found', async () => {
      const uid = 'ec968f0d-1234-5678-9abc-def012345678';
      mockBackupProfileRepository.getBackupProfileByPoiId.mockResolvedValue(
        mockBackupProfile,
      );

      const result = await useCase.handler(uid);

      expect(repository.getBackupProfileByPoiId).toHaveBeenCalledWith(uid);
      expect(repository.getBackupProfileByPoiId).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBackupProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      const uid = 'non-existent-uid';
      mockBackupProfileRepository.getBackupProfileByPoiId.mockRejectedValue(
        new NotFoundException('ไม่พบ Backup Profile'),
      );

      await expect(useCase.handler(uid)).rejects.toThrow(NotFoundException);
      await expect(useCase.handler(uid)).rejects.toThrow('ไม่พบ Backup Profile');
      expect(repository.getBackupProfileByPoiId).toHaveBeenCalledWith(uid);
    });

    it('should handle repository errors', async () => {
      const uid = 'error-uid';
      mockBackupProfileRepository.getBackupProfileByPoiId.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(useCase.handler(uid)).rejects.toThrow('Database error');
      expect(repository.getBackupProfileByPoiId).toHaveBeenCalledWith(uid);
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});
