import { Test, TestingModule } from '@nestjs/testing';
import { SaveBackupProfileUseCase } from './saveBackupProfile.usecase';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SaveBackupProfileUseCase', () => {
  let useCase: SaveBackupProfileUseCase;
  let repository: BackupProfileRepositoryPort;

  const mockBackupProfileRepository = {
    getBackupProfileByUid: jest.fn(),
    findByUid: jest.fn(),
    findByPoiId: jest.fn(),
    createBackupProfile: jest.fn(),
    updateBackupProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveBackupProfileUseCase,
        {
          provide: 'BackupProfileRepository',
          useValue: mockBackupProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get<SaveBackupProfileUseCase>(SaveBackupProfileUseCase);
    repository = module.get<BackupProfileRepositoryPort>('BackupProfileRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler - create mode', () => {
    const createData = {
      poiLayerId: 1,
      poiId: 12345,
      formLocNumber: 'FORM001',
      zoneCode: 'Z001',
      shape: 'POLYGON((100.5 13.7, 100.6 13.7, 100.6 13.8, 100.5 13.8, 100.5 13.7))',
      backupColor: 2,
      backupColorLayer: '#FF5733',
      mainProfile: 'Main Profile 1',
      subProfile: 'Sub Profile 1',
      areaSize: 100.5,
      backupRemark: 'Test remark',
      strategicLocation: '01',
      strategicSupport: 'Support 1',
      strategicPlace: 'Place 1',
      profiles: [],
      profilePois: [],
      competitors: [],
      createBy: 1,
    };

    it('should create backup profile successfully', async () => {
      const mockResult = {
        id: 1,
        uid: 'ec968f0d-1234-5678-9abc-def012345678',
        message: 'Backup profile created successfully',
      };

      mockBackupProfileRepository.findByPoiId.mockResolvedValue(null);
      mockBackupProfileRepository.createBackupProfile.mockResolvedValue(mockResult);

      const result = await useCase.handler(createData);

      expect(repository.findByPoiId).toHaveBeenCalledWith(createData.poiId);
      expect(repository.createBackupProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          isActive: 'Y',
          createDate: expect.any(Date),
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw BadRequestException when poiId is missing', async () => {
      const invalidData = { ...createData, poiId: null };

      await expect(useCase.handler(invalidData)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(invalidData)).rejects.toThrow(
        'POI ID and POI Layer ID are required',
      );
    });

    it('should throw BadRequestException when poiLayerId is missing', async () => {
      const invalidData = { ...createData, poiLayerId: null };

      await expect(useCase.handler(invalidData)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(invalidData)).rejects.toThrow(
        'POI ID and POI Layer ID are required',
      );
    });

    it('should throw BadRequestException when strategicLocation is missing', async () => {
      const invalidData = { ...createData, strategicLocation: null };

      await expect(useCase.handler(invalidData)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(invalidData)).rejects.toThrow(
        'Strategic Location is required',
      );
    });

    it('should throw BadRequestException when backup profile already exists for poiId', async () => {
      const existingProfile = {
        id: 1,
        uid: 'existing-uid',
        poiId: createData.poiId,
      };

      mockBackupProfileRepository.findByPoiId.mockResolvedValue(existingProfile);

      await expect(useCase.handler(createData)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(createData)).rejects.toThrow(
        'มี Backup Profile ของ POI นี้แล้ว',
      );
      expect(repository.findByPoiId).toHaveBeenCalledWith(createData.poiId);
    });

    it('should set default isActive to Y when not provided', async () => {
      const dataWithoutIsActive = { ...createData };
      delete dataWithoutIsActive['isActive'];

      const mockResult = {
        id: 1,
        uid: 'ec968f0d-1234-5678-9abc-def012345678',
        message: 'Backup profile created successfully',
      };

      mockBackupProfileRepository.findByPoiId.mockResolvedValue(null);
      mockBackupProfileRepository.createBackupProfile.mockResolvedValue(mockResult);

      await useCase.handler(dataWithoutIsActive);

      expect(repository.createBackupProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: 'Y',
        }),
      );
    });
  });

  describe('handler - update mode', () => {
    const uid = 'ec968f0d-1234-5678-9abc-def012345678';
    const updateData = {
      poiLayerId: 1,
      poiId: 12345,
      formLocNumber: 'FORM001',
      zoneCode: 'Z001',
      shape: 'POLYGON((100.5 13.7, 100.6 13.7, 100.6 13.8, 100.5 13.8, 100.5 13.7))',
      backupColor: 2,
      backupColorLayer: '#FF5733',
      isActive: 'Y',
      mainProfile: 'Updated Main Profile',
      subProfile: 'Updated Sub Profile',
      areaSize: 150.5,
      backupRemark: 'Updated remark',
      strategicLocation: '02',
      strategicSupport: 'Updated Support',
      strategicPlace: 'Updated Place',
      profiles: [],
      profilePois: [],
      competitors: [],
      updateBy: 1,
    };

    it('should update backup profile successfully', async () => {
      const mockResult = {
        id: 1,
        message: 'Backup profile updated successfully',
      };

      mockBackupProfileRepository.updateBackupProfile.mockResolvedValue(mockResult);

      const result = await useCase.handler(updateData, uid);

      expect(repository.updateBackupProfile).toHaveBeenCalledWith(
        uid,
        expect.objectContaining({
          ...updateData,
          updateDate: expect.any(Date),
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('should treat empty string uid as create mode', async () => {
      // Empty string is falsy, so it goes to create path
      const createResult = {
        id: 1,
        uid: 'ec968f0d-1234-5678-9abc-def012345678',
        message: 'Backup profile created successfully',
      };

      mockBackupProfileRepository.findByPoiId.mockResolvedValue(null);
      mockBackupProfileRepository.createBackupProfile.mockResolvedValue(createResult);

      const result = await useCase.handler(updateData, '');

      expect(repository.createBackupProfile).toHaveBeenCalled();
      expect(repository.updateBackupProfile).not.toHaveBeenCalled();
      expect(result).toEqual(createResult);
    });

    it('should handle repository update errors', async () => {
      mockBackupProfileRepository.updateBackupProfile.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(useCase.handler(updateData, uid)).rejects.toThrow('Update failed');
      expect(repository.updateBackupProfile).toHaveBeenCalledWith(
        uid,
        expect.any(Object),
      );
    });

    it('should add updateDate to profile data', async () => {
      const mockResult = {
        id: 1,
        message: 'Backup profile updated successfully',
      };

      mockBackupProfileRepository.updateBackupProfile.mockResolvedValue(mockResult);

      await useCase.handler(updateData, uid);

      expect(repository.updateBackupProfile).toHaveBeenCalledWith(
        uid,
        expect.objectContaining({
          updateDate: expect.any(Date),
        }),
      );
    });
  });

  describe('handler - route decision', () => {
    it('should call createBackupProfile when uid is not provided', async () => {
      const createData = {
        poiLayerId: 1,
        poiId: 12345,
        strategicLocation: '01',
        createBy: 1,
      };

      mockBackupProfileRepository.findByPoiId.mockResolvedValue(null);
      mockBackupProfileRepository.createBackupProfile.mockResolvedValue({ id: 1 });

      await useCase.handler(createData);

      expect(repository.createBackupProfile).toHaveBeenCalled();
      expect(repository.updateBackupProfile).not.toHaveBeenCalled();
    });

    it('should call updateBackupProfile when uid is provided', async () => {
      const uid = 'ec968f0d-1234-5678-9abc-def012345678';
      const updateData = {
        poiLayerId: 1,
        poiId: 12345,
        strategicLocation: '01',
        updateBy: 1,
      };

      mockBackupProfileRepository.updateBackupProfile.mockResolvedValue({ id: 1 });

      await useCase.handler(updateData, uid);

      expect(repository.updateBackupProfile).toHaveBeenCalled();
      expect(repository.createBackupProfile).not.toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });
});
