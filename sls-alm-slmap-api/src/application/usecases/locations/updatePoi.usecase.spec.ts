import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UpdatePoiUseCase } from './updatePoi.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { PoiType } from '../../../common/enums/poi.enum';

describe('UpdatePoiUseCase', () => {
  let useCase: UpdatePoiUseCase;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;

  beforeEach(async () => {
    const repo: Partial<jest.Mocked<PoiRepositoryPort>> = {
      findPoiDetailById: jest.fn(),
      updateEnvironmentPoi: jest.fn(),
      update: jest.fn(),
      updatePotentialStore: jest.fn(),
      updateSevenElement: jest.fn(),
      updateVendingElement: jest.fn(),
      // not used here but often required by other providers/ports
      findPoiLocationByQuery: jest.fn(),
      findById: jest.fn(),
      findZoneAndSubZoneByCoordinate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePoiUseCase,
        {
          provide: 'PoiRepository',
          useValue: repo,
        },
      ],
    }).compile();

    useCase = module.get<UpdatePoiUseCase>(UpdatePoiUseCase);
    mockPoiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should throw BadRequestException when poiId is missing/invalid', async () => {
      await expect(useCase.handler(undefined as any, {} as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.handler(0 as any, {} as any)).rejects.toThrow(
        new BadRequestException('Invalid POI ID'),
      );
      await expect(useCase.handler(-1 as any, {} as any)).rejects.toThrow(
        new BadRequestException('Invalid POI ID'),
      );

      expect(mockPoiRepository.findPoiDetailById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when existing POI is not found', async () => {
      mockPoiRepository.findPoiDetailById.mockResolvedValue(null as any);

      await expect(
        useCase.handler(999, { type: PoiType.ENVIRONMENT } as any),
      ).rejects.toThrow(NotFoundException);

      expect(mockPoiRepository.findPoiDetailById).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findPoiDetailById).toHaveBeenCalledWith(999);
    });

    it('should update environment POI when dto.type is ENVIRONMENT', async () => {
      const poiId = 1;
      const userId = 123;

      mockPoiRepository.findPoiDetailById
        .mockResolvedValueOnce({
          poi: { id: poiId } as any,
          potentialStore: null,
          sevenEleven: null,
          vendingMachine: null,
        } as any)
        .mockResolvedValueOnce({
          poi: { id: poiId, name: 'Updated Env' } as any,
          potentialStore: null,
          sevenEleven: null,
          vendingMachine: null,
        } as any);

      const dto = {
        type: PoiType.ENVIRONMENT,
        environment: {
          name: 'Updated Env',
          address: 'New address',
          category: 'CAT-1',
        },
      } as any;

      const result = await useCase.handler(poiId, dto, userId);

      expect(mockPoiRepository.updateEnvironmentPoi).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.updateEnvironmentPoi).toHaveBeenCalledWith(poiId, {
        name: 'Updated Env',
        address: 'New address',
        category: 'CAT-1',
        createdBy: userId,
      });

      expect(mockPoiRepository.update).not.toHaveBeenCalled();
      expect(mockPoiRepository.updatePotentialStore).not.toHaveBeenCalled();

      // called twice: before + after update
      expect(mockPoiRepository.findPoiDetailById).toHaveBeenCalledTimes(2);
      expect(mockPoiRepository.findPoiDetailById).toHaveBeenNthCalledWith(1, poiId);
      expect(mockPoiRepository.findPoiDetailById).toHaveBeenNthCalledWith(2, poiId);

      expect(result).toEqual({
        type: PoiType.ENVIRONMENT,
        poi: { id: poiId, name: 'Updated Env' },
        potentialStore: null,
        sevenEleven: null,
        vendingMachine: null,
      });
    });

    it('should throw BadRequestException when ENVIRONMENT but dto.environment is missing', async () => {
      const poiId = 1;

      // Must exist first; then it will fail on missing dto.environment
      mockPoiRepository.findPoiDetailById.mockResolvedValueOnce({
        poi: { id: poiId } as any,
        potentialStore: null,
        sevenEleven: null,
        vendingMachine: null,
      } as any);

      const dto = {
        type: PoiType.ENVIRONMENT,
        environment: undefined,
      } as any;

      await expect(useCase.handler(poiId, dto, 1)).rejects.toThrow(
        new BadRequestException('Environment data is required for environment type POI'),
      );

      // validate it doesn't attempt writes
      expect(mockPoiRepository.updateEnvironmentPoi).not.toHaveBeenCalled();
      expect(mockPoiRepository.update).not.toHaveBeenCalled();
      expect(mockPoiRepository.updatePotentialStore).not.toHaveBeenCalled();

      // should not re-fetch updated POI on validation failure
      expect(mockPoiRepository.findPoiDetailById).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findPoiDetailById).toHaveBeenCalledWith(poiId);
    });

    it('should infer POTENTIAL type from existingPoi when dto.type is not provided and potentialStore exists', async () => {
      const poiId = 7;

      mockPoiRepository.findPoiDetailById
        .mockResolvedValueOnce({
          poi: { id: poiId } as any,
          potentialStore: { id: 55 } as any,
        } as any)
        .mockResolvedValueOnce({
          poi: { id: poiId, name: 'Updated Potential POI' } as any,
          potentialStore: { id: 55 } as any,
          sevenEleven: null,
          vendingMachine: null,
        } as any);

      const dto = {
        // type omitted intentionally
        potential: {
          name: 'Updated Potential POI',
          address: 'Addr',
          locationType: 1,
          areaType: 2,
          alcoholSale: 1,
          cigaretteSale: 0,
        },
      } as any;

      const result = await useCase.handler(poiId, dto);

      expect(result.type).toBe(PoiType.POTENTIAL);

      expect(mockPoiRepository.update).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.updatePotentialStore).toHaveBeenCalledTimes(1);

      expect(mockPoiRepository.updateSevenElement).not.toHaveBeenCalled();
      expect(mockPoiRepository.updateVendingElement).not.toHaveBeenCalled();
    });

    it('should update potential POI (poi + potential store) and update seven/vending elements when present', async () => {
      const poiId = 10;
      const potentialStoreId = 777;

      mockPoiRepository.findPoiDetailById
        .mockResolvedValueOnce({
          poi: { id: poiId } as any,
          potentialStore: { id: potentialStoreId } as any,
        } as any)
        .mockResolvedValueOnce({
          poi: { id: poiId, name: 'P' } as any,
          potentialStore: { id: potentialStoreId } as any,
          sevenEleven: { id: 1 } as any,
          vendingMachine: { id: 2 } as any,
        } as any);

      const dto = {
        type: PoiType.POTENTIAL,
        potential: {
          name: 'P',
          address: 'Some Addr',
          locationType: 1,
          areaType: 2,
          alcoholSale: 1,
          cigaretteSale: 0,
        },
        seven: {
          name: 'Seven Name',
          storeCode: 'SC001',
          standardLayout: 'Y',
          investmentType: '1',
          impactType: '2',
          impactDetail: 'detail',
          openMonth: '2025-01',
          dimension: {
            width: '10',
            length: '20',
            saleArea: '30',
            stockArea: '40',
            storeArea: '50',
          },
          parkingCount: '6',
          storeBuildingType: '7',
        },
        vending: {
          parentBranchCode: 'PB001',
          name: 'VM',
          machineId: 'SN001',
          serialNumber: 'SN001',
          model: 'M1',
          vendingType: '1',
          address: 'VM address',
          contractStartDate: '2025-01-01',
          contractEndDate: '2025-12-31',
          contractCancelDate: null,
          serviceStartDate: '2025-02-01',
          serviceEndDate: null,
          targetPoint: 100,
          businessTypeCode: 'B1',
          floor: '3',
        },
      } as any;

      await useCase.handler(poiId, dto);

      expect(mockPoiRepository.update).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.update).toHaveBeenCalledWith(
        poiId,
        expect.objectContaining({
          name: 'P',
          locationT: 'Some Addr',
        }),
      );

      expect(mockPoiRepository.updatePotentialStore).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.updatePotentialStore).toHaveBeenCalledWith(
        potentialStoreId,
        expect.objectContaining({
          locationType: 1,
          areaType: 2,
          canSaleAlcohol: 'Y',
          canSaleCigarette: 'N',
        }),
      );

      expect(mockPoiRepository.updateSevenElement).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.updateSevenElement).toHaveBeenCalledWith(
        expect.objectContaining({
          potentialStoreId,
          name: 'Seven Name',
          storeCode: 'SC001',
          standardLayout: 'Y',
          storeFranchise: 1,
          impactTypeSite: 2,
          impactDetail: 'detail',
          estimateDateOpen: '2025-01',
          storeWidth: 10,
          storeLength: 20,
          saleArea: 30,
          stockArea: 40,
          storeArea: 50,
          parkingCount: 6,
          storeBuildingType: 7,
        }),
      );

      expect(mockPoiRepository.updateVendingElement).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.updateVendingElement).toHaveBeenCalledWith(
        potentialStoreId,
        expect.objectContaining({
          storecode: 'PB001',
          machineId: 'SN001',
          name: 'VM',
          serialNumber: 'SN001',
          vendingModel: 'M1',
          vendingType: 1,
          locationAddress: 'VM address',
          contractStartDate: '2025-01-01',
          contractFinishDate: '2025-12-31',
          contractCancelDate: null,
          openDate: '2025-02-01',
          closeDate: null,
          targetPoint: 100,
          businessTypeCode: 'B1',
          floor: 3,
        }),
      );
    });

    it('should throw BadRequestException when dto.type is invalid (neither ENVIRONMENT nor POTENTIAL)', async () => {
      const poiId = 1;

      // Must exist first; then it will fail on invalid type
      mockPoiRepository.findPoiDetailById.mockResolvedValueOnce({
        poi: { id: poiId } as any,
        potentialStore: null,
        sevenEleven: null,
        vendingMachine: null,
      } as any);

      await expect(useCase.handler(poiId, { type: 'INVALID' } as any)).rejects.toThrow(
        new BadRequestException('Invalid POI type: INVALID'),
      );

      expect(mockPoiRepository.updateEnvironmentPoi).not.toHaveBeenCalled();
      expect(mockPoiRepository.update).not.toHaveBeenCalled();
      expect(mockPoiRepository.updatePotentialStore).not.toHaveBeenCalled();
      expect(mockPoiRepository.updateSevenElement).not.toHaveBeenCalled();
      expect(mockPoiRepository.updateVendingElement).not.toHaveBeenCalled();

      // should not re-fetch updated POI on validation failure
      expect(mockPoiRepository.findPoiDetailById).toHaveBeenCalledTimes(1);
      expect(mockPoiRepository.findPoiDetailById).toHaveBeenCalledWith(poiId);
    });

    it('should propagate repository errors', async () => {
      const poiId = 1;
      const err = new Error('db error');

      mockPoiRepository.findPoiDetailById.mockRejectedValueOnce(err);

      await expect(
        useCase.handler(poiId, { type: PoiType.ENVIRONMENT } as any),
      ).rejects.toThrow(err);
    });
  });
});
