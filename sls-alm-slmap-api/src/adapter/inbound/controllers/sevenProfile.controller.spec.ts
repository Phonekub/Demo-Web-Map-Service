import { Test, TestingModule } from '@nestjs/testing';
import { SevenProfileController } from './sevenProfile.controller';
import { GetSevenInfoByStorecodeUseCase } from '../../../application/usecases/locations/getSevenInfoByStorecode.usecase';
import { SevenInfo } from '../../../domain/sevenInfo';

const mockSevenInfo: SevenInfo = {
  storecode: '1000001',
  storename: 'สาขาทดสอบ',
  locationT: 'สถานที่ทดสอบ',
  tradeArea: 'A',
  branchType: '1',
  sevenType: 'type1',
  contractStartDate: '01/01/2020',
  contractEndDate: '31/12/2030',
  storeWidth: null,
  storeLength: null,
  saleArea: '30',
  stockArea: null,
  storeArea: '50',
  storeBuildingType: 'standalone',
  roomAmount: '1',
  storeParking: null,
  storeParkingMotocycle: null,
  openDate: '01/01/2020',
  closeDate: null,
  officeHours: '24hr',
  renovateStartDate: null,
  renovateEndDate: null,
  tempcloseStartDate: null,
  tempcloseEndDate: null,
  saleAverage: '150000.00',
  customerAverage: '500',
  salePricePerson: '300.00',
  opentypeAmount: '2',
  vaultAmount: '1',
  shelf: '10',
  posAmount: '3',
  canSaleCigarette: null,
  canSaleAlcohol: null,
};

const mockUseCase = {
  handler: jest.fn(),
};

describe('SevenProfileController', () => {
  let controller: SevenProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SevenProfileController],
      providers: [
        {
          provide: GetSevenInfoByStorecodeUseCase,
          useValue: mockUseCase,
        },
      ],
    }).compile();

    controller = module.get<SevenProfileController>(SevenProfileController);

    jest.clearAllMocks();
  });

  describe('GET poi/:poiId', () => {
    it('should return { data: SevenInfo } when found', async () => {
      mockUseCase.handler.mockResolvedValue(mockSevenInfo);

      const result = await controller.getSevenProfileByPoiId(123);

      expect(mockUseCase.handler).toHaveBeenCalledWith(123);
      expect(result).toEqual({ data: mockSevenInfo });
    });

    it('should return { data: null } when not found', async () => {
      mockUseCase.handler.mockResolvedValue(null);

      const result = await controller.getSevenProfileByPoiId(999);

      expect(mockUseCase.handler).toHaveBeenCalledWith(999);
      expect(result).toEqual({ data: null });
    });

    it('should call usecase with correct poiId', async () => {
      mockUseCase.handler.mockResolvedValue(null);

      await controller.getSevenProfileByPoiId(456);

      expect(mockUseCase.handler).toHaveBeenCalledTimes(1);
      expect(mockUseCase.handler).toHaveBeenCalledWith(456);
    });
  });
});
