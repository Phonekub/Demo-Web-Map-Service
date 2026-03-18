import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreatePoiUseCase } from './createPoi.usecase';
import { GetCoordinateInfoUseCase } from './getCoordinateInfo.usecase';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { PoiType } from '../../../common/enums/poi.enum';
import { Layer } from '../../../common/enums/layer.enum';
import { PotentialStatus } from '@common/enums/potential.enum';
import { CreatePoiDto } from '../../../adapter/inbound/dtos/createPoi.dto';
import { DataSource, QueryRunner } from 'typeorm';

describe('CreatePoiUseCase', () => {
  let useCase: CreatePoiUseCase;
  let mockGetCoordinateInfoUseCase: jest.Mocked<GetCoordinateInfoUseCase>;
  let mockPoiRepository: jest.Mocked<PoiRepositoryPort>;
  let mockCreateWorkflowTransactionUseCase: jest.Mocked<CreateWorkflowTransactionUseCase>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  const mockUserZoneCodes = {
    Z001: ['SZ001', 'SZ002'],
    Z002: ['SZ003', 'SZ004'],
  };

  const mockCoordinateInfo = {
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
      text: 'Bangkok',
      code: '1001',
    },
  };

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {},
    } as unknown as jest.Mocked<QueryRunner>;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;

    const mockGetCoordinateInfo = {
      handler: jest.fn(),
    };

    const mockPoiRepo = {
      createEnvironmentPoi: jest.fn(),
      createPotentialPoi: jest.fn(),
      updatePotentialStore: jest.fn(),
    };

    const mockCreateWorkflowTransaction = {
      handler: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePoiUseCase,
        {
          provide: GetCoordinateInfoUseCase,
          useValue: mockGetCoordinateInfo,
        },
        {
          provide: 'PoiRepository',
          useValue: mockPoiRepo,
        },
        {
          provide: CreateWorkflowTransactionUseCase,
          useValue: mockCreateWorkflowTransaction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    useCase = module.get<CreatePoiUseCase>(CreatePoiUseCase);
    mockGetCoordinateInfoUseCase = module.get(GetCoordinateInfoUseCase);
    mockPoiRepository = module.get('PoiRepository');
    mockCreateWorkflowTransactionUseCase = module.get(CreateWorkflowTransactionUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    describe('Coordinate validation', () => {
      it('should throw BadRequestException when coordinateInfo is null', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.ENVIRONMENT,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          environment: {
            name: 'Test Environment',
            address: 'Test Address',
            category: 1,
          },
        };

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.handler(dto, 1, mockUserZoneCodes)).rejects.toThrow(
          new BadRequestException(
            'The provided coordinates are outside your authorized zones',
          ),
        );

        expect(mockGetCoordinateInfoUseCase.handler).toHaveBeenCalledWith(
          mockUserZoneCodes,
          dto.latitude,
          dto.longitude,
        );
      });

      it('should throw BadRequestException when zoneAuthorized is false', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.ENVIRONMENT,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          environment: {
            name: 'Test Environment',
            address: 'Test Address',
            category: 1,
          },
        };

        const unauthorizedCoordinateInfo = {
          ...mockCoordinateInfo,
          zoneAuthorized: false,
        };

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(
          unauthorizedCoordinateInfo,
        );

        // Act & Assert
        await expect(useCase.handler(dto, 1, mockUserZoneCodes)).rejects.toThrow(
          new BadRequestException('You are not authorized to create POIs'),
        );
      });

      it('should throw BadRequestException for invalid POI type', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: 'INVALID_TYPE' as unknown as PoiType,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
        };

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);

        // Act & Assert
        await expect(useCase.handler(dto, 1, mockUserZoneCodes)).rejects.toThrow(
          new BadRequestException('Invalid POI type: INVALID_TYPE'),
        );
      });
    });

    describe('Environment POI creation', () => {
      it('should successfully create an environment POI', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.ENVIRONMENT,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          environment: {
            name: 'Test Environment',
            address: '123 Test Street',
            category: 1,
          },
        };

        const insertedId = 123;
        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createEnvironmentPoi.mockResolvedValue(insertedId);

        // Act
        const result = await useCase.handler(dto, 1, mockUserZoneCodes);

        // Assert
        expect(result).toEqual({ poiId: insertedId });
        expect(mockPoiRepository.createEnvironmentPoi).toHaveBeenCalledWith({
          latitude: dto.latitude,
          longitude: dto.longitude,
          name: dto.environment.name,
          address: dto.environment.address,
          category: dto.environment.category,
          zoneCode: 'Z001',
          subzoneCode: 'SZ001',
          tamCode: '100101001',
          ampCode: '100101',
          provCode: '1001',
          nation: '10',
          createdBy: 1,
        });
      });

      it('should throw BadRequestException when environment data is missing', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.ENVIRONMENT,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
        };

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);

        // Act & Assert
        await expect(useCase.handler(dto, 1, mockUserZoneCodes)).rejects.toThrow(
          new BadRequestException(
            'Environment data is required for environment type POI',
          ),
        );
        expect(mockPoiRepository.createEnvironmentPoi).not.toHaveBeenCalled();
      });

      it('should create environment POI without userId', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.ENVIRONMENT,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          environment: {
            name: 'Test Environment',
            address: '123 Test Street',
            category: 1,
          },
        };

        const insertedId = 456;
        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createEnvironmentPoi.mockResolvedValue(insertedId);

        // Act
        const result = await useCase.handler(dto, undefined, mockUserZoneCodes);

        // Assert
        expect(result).toEqual({ poiId: insertedId });
        expect(mockPoiRepository.createEnvironmentPoi).toHaveBeenCalledWith(
          expect.objectContaining({
            createdBy: undefined,
          }),
        );
      });
    });

    describe('Potential POI creation', () => {
      it('should successfully create a potential POI with basic data', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Potential',
            address: '456 Potential Street',
            locationType: 'Store',
            areaType: 'Urban',
            alcoholSale: 1,
            cigaretteSale: 0,
          },
        };

        const poiId = 789;
        const potentialStoreId = 101;
        const wfTransactionId = 202;

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockResolvedValue({
          poiId,
          potentialStoreId,
        });
        mockCreateWorkflowTransactionUseCase.handler.mockResolvedValue({
          success: true,
          data: { wfTransactionId },
        });
        mockPoiRepository.updatePotentialStore.mockResolvedValue(undefined);

        // Act
        const result = await useCase.handler(dto, 1, mockUserZoneCodes);

        // Assert
        expect(result).toEqual({ poiId });
        expect(mockQueryRunner.connect).toHaveBeenCalled();
        expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
        expect(mockPoiRepository.createPotentialPoi).toHaveBeenCalledWith(
          expect.objectContaining({
            layerId: Layer.POTENTIAL,
            latitude: dto.latitude,
            longitude: dto.longitude,
            createdBy: 1,
            potential: expect.objectContaining({
              name: dto.potential.name,
              address: dto.potential.address,
              locationType: dto.potential.locationType,
              areaType: dto.potential.areaType,
              alcoholSale: dto.potential.alcoholSale,
              cigaretteSale: dto.potential.cigaretteSale,
              zoneCode: 'Z001',
              subzoneCode: 'SZ001',
              tamCode: '100101001',
              ampCode: '100101',
              provCode: '1001',
              nation: '10',
            }),
          }),
          mockQueryRunner,
        );
        expect(mockCreateWorkflowTransactionUseCase.handler).toHaveBeenCalledWith(
          4,
          potentialStoreId,
          1,
        );
        expect(mockPoiRepository.updatePotentialStore).toHaveBeenCalledWith(
          potentialStoreId,
          expect.objectContaining({
            wfTransactionId,
            status: PotentialStatus.PRE_POTENTIAL,
          }),
          mockQueryRunner,
        );
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should successfully create a potential POI with Seven data', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Seven Store',
            address: '789 Seven Street',
          },
          seven: {
            name: '7-Eleven Test',
            storeCode: '12345',
            standardLayout: 'Standard',
            estimateDateOpen: '2024-12-31',
            impactType: '1',
            impactDetail: 'High impact',
            dimension: {
              width: '10',
              length: '20',
              saleArea: '150',
              stockArea: '50',
              storeArea: '200',
            },
            parkingCount: '5',
            storeBuildingType: '2',
            investmentType: '1',
            storeFranchise: '1',
          },
        };

        const poiId = 999;
        const potentialStoreId = 111;
        const wfTransactionId = 222;

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockResolvedValue({
          poiId,
          potentialStoreId,
        });
        mockCreateWorkflowTransactionUseCase.handler.mockResolvedValue({
          success: true,
          data: { wfTransactionId },
        });

        // Act
        const result = await useCase.handler(dto, 2, mockUserZoneCodes);

        // Assert
        expect(result).toEqual({ poiId });
        expect(mockPoiRepository.createPotentialPoi).toHaveBeenCalledWith(
          expect.objectContaining({
            seven: expect.objectContaining({
              name: '7-Eleven Test',
              storeCode: '12345',
              impactTypeSite: 1,
              impactDetail: 'High impact',
              estimateDateOpen: '2024-12-31',
              storeWidth: 10,
              storeLength: 20,
              saleArea: 150,
              stockArea: 50,
              storeArea: 200,
              parkingCount: 5,
              storeBuildingType: 2,
              storeFranchise: 1,
              standardLayout: 'Standard',
            }),
          }),
          mockQueryRunner,
        );
      });

      it('should successfully create a potential POI with Vending data', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Vending Location',
            address: '321 Vending Street',
          },
          vending: {
            parentBranchCode: 'BR001',
            name: 'Vending Machine 1',
            machineId: 'SN123456',
            serialNumber: 'SN123456',
            model: 'Model X',
            vendingType: 1,
            address: '321 Vending Street',
            contractStartDate: '2024-01-01',
            contractEndDate: '2025-01-01',
            contractCancelDate: '2025-06-01',
            serviceStartDate: '2024-01-15',
            serviceEndDate: '2024-12-31',
            targetPoint: '1000',
            floor: '2',
          },
        };

        const poiId = 888;
        const potentialStoreId = 333;
        const wfTransactionId = 444;

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockResolvedValue({
          poiId,
          potentialStoreId,
        });
        mockCreateWorkflowTransactionUseCase.handler.mockResolvedValue({
          success: true,
          data: { wfTransactionId },
        });

        // Act
        const result = await useCase.handler(dto, 3, mockUserZoneCodes);

        // Assert
        expect(result).toEqual({ poiId });
        expect(mockPoiRepository.createPotentialPoi).toHaveBeenCalledWith(
          expect.objectContaining({
            vending: expect.objectContaining({
              storecode: 'BR001',
              machineId: 'SN123456',
              name: 'Vending Machine 1',
              serialNumber: 'SN123456',
              vendingModel: 'Model X',
              vendingType: 1,
              locationAddress: '321 Vending Street',
              contractStartDate: '2024-01-01',
              contractFinishDate: '2025-01-01',
              contractCancelDate: '2025-06-01',
              openDate: '2024-01-15',
              closeDate: '2024-12-31',
              targetPoint: '1000',
              floor: 2,
            }),
          }),
          mockQueryRunner,
        );
      });

      it('should throw BadRequestException when potential data is missing', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
        };

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);

        // Act & Assert
        await expect(useCase.handler(dto, 1, mockUserZoneCodes)).rejects.toThrow(
          new BadRequestException('Potential data is required for potential type POI'),
        );
        expect(mockPoiRepository.createPotentialPoi).not.toHaveBeenCalled();
      });

      it('should rollback transaction when workflow creation fails', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Potential',
            address: '456 Potential Street',
          },
        };

        const poiId = 789;
        const potentialStoreId = 101;

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockResolvedValue({
          poiId,
          potentialStoreId,
        });
        mockCreateWorkflowTransactionUseCase.handler.mockResolvedValue({
          success: false,
          error: {
            code: 'DB_ERROR',
            message: 'Workflow creation failed',
          },
        });

        // Act & Assert
        await expect(useCase.handler(dto, 1, mockUserZoneCodes)).rejects.toThrow(
          new BadRequestException('Workflow creation failed'),
        );

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should rollback transaction when workflow transaction ID is not returned', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Potential',
            address: '456 Potential Street',
          },
        };

        const poiId = 789;
        const potentialStoreId = 101;

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockResolvedValue({
          poiId,
          potentialStoreId,
        });
        mockCreateWorkflowTransactionUseCase.handler.mockResolvedValue({
          success: true,
          data: { wfTransactionId: undefined as unknown as number },
        });

        // Act & Assert
        await expect(useCase.handler(dto, 1, mockUserZoneCodes)).rejects.toThrow(
          new BadRequestException(
            'Workflow transaction ID not returned from workflow service',
          ),
        );

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should rollback transaction when createPotentialPoi throws error', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Potential',
            address: '456 Potential Street',
          },
        };

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(useCase.handler(dto, 1, mockUserZoneCodes)).rejects.toThrow(
          'Database error',
        );

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should handle optional fields in seven data correctly', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Seven Store',
            address: '789 Seven Street',
          },
          seven: {
            name: '7-Eleven Test',
            storeCode: '12345',
          },
        };

        const poiId = 999;
        const potentialStoreId = 111;
        const wfTransactionId = 222;

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockResolvedValue({
          poiId,
          potentialStoreId,
        });
        mockCreateWorkflowTransactionUseCase.handler.mockResolvedValue({
          success: true,
          data: { wfTransactionId },
        });

        // Act
        const result = await useCase.handler(dto, 2, mockUserZoneCodes);

        // Assert
        expect(result).toEqual({ poiId });
        expect(mockPoiRepository.createPotentialPoi).toHaveBeenCalledWith(
          expect.objectContaining({
            seven: expect.objectContaining({
              name: '7-Eleven Test',
              storeCode: '12345',
              impactTypeSite: undefined,
              impactDetail: undefined,
              estimateDateOpen: undefined,
              storeWidth: undefined,
              storeLength: undefined,
              saleArea: undefined,
              stockArea: undefined,
              storeArea: undefined,
              parkingCount: undefined,
              storeBuildingType: undefined,
              storeFranchise: undefined,
              standardLayout: undefined,
            }),
          }),
          mockQueryRunner,
        );
      });

      it('should handle potential POI without seven or vending data', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Potential',
            address: '456 Potential Street',
          },
        };

        const poiId = 789;
        const potentialStoreId = 101;
        const wfTransactionId = 202;

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(mockCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockResolvedValue({
          poiId,
          potentialStoreId,
        });
        mockCreateWorkflowTransactionUseCase.handler.mockResolvedValue({
          success: true,
          data: { wfTransactionId },
        });

        // Act
        const result = await useCase.handler(dto, 1, mockUserZoneCodes);

        // Assert
        expect(result).toEqual({ poiId });
        expect(mockPoiRepository.createPotentialPoi).toHaveBeenCalledWith(
          expect.objectContaining({
            seven: undefined,
            vending: undefined,
          }),
          mockQueryRunner,
        );
      });

      it('should correctly truncate province and district codes', async () => {
        // Arrange
        const dto: CreatePoiDto = {
          type: PoiType.POTENTIAL,
          latitude: 13.7563,
          longitude: 100.5018,
          zone: 'Z001',
          subzone: 'SZ001',
          potential: {
            name: 'Test Potential',
            address: '456 Potential Street',
          },
        };

        const customCoordinateInfo = {
          zoneAuthorized: true,
          zone: 'Z001',
          subzone: 'SZ001',
          subDistrict: {
            text: 'Test Sub District',
            code: '123456789',
          },
          district: {
            text: 'Test District',
            code: '12345678',
          },
          province: {
            text: 'Test Province',
            code: '12345678',
          },
        };

        const poiId = 789;
        const potentialStoreId = 101;
        const wfTransactionId = 202;

        mockGetCoordinateInfoUseCase.handler.mockResolvedValue(customCoordinateInfo);
        mockPoiRepository.createPotentialPoi.mockResolvedValue({
          poiId,
          potentialStoreId,
        });
        mockCreateWorkflowTransactionUseCase.handler.mockResolvedValue({
          success: true,
          data: { wfTransactionId },
        });

        // Act
        await useCase.handler(dto, 1, mockUserZoneCodes);

        // Assert
        expect(mockPoiRepository.createPotentialPoi).toHaveBeenCalledWith(
          expect.objectContaining({
            potential: expect.objectContaining({
              nation: '12',
              provCode: '1234',
              ampCode: '123456',
              tamCode: '123456789',
            }),
          }),
          mockQueryRunner,
        );
      });
    });
  });
});
