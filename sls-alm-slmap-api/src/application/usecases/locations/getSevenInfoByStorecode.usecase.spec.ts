import { Test, TestingModule } from '@nestjs/testing';
import { GetSevenInfoByStorecodeUseCase } from './getSevenInfoByStorecode.usecase';
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

const mockSevenInfoRepository = {
  findByPoiId: jest.fn(),
};

describe('GetSevenInfoByStorecodeUseCase', () => {
  let useCase: GetSevenInfoByStorecodeUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSevenInfoByStorecodeUseCase,
        {
          provide: 'SevenInfoRepository',
          useValue: mockSevenInfoRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetSevenInfoByStorecodeUseCase>(
      GetSevenInfoByStorecodeUseCase,
    );

    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should return SevenInfo when found', async () => {
      mockSevenInfoRepository.findByPoiId.mockResolvedValue(mockSevenInfo);

      const result = await useCase.handler(123);

      expect(mockSevenInfoRepository.findByPoiId).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockSevenInfo);
    });

    it('should return null when not found', async () => {
      mockSevenInfoRepository.findByPoiId.mockResolvedValue(null);

      const result = await useCase.handler(999);

      expect(mockSevenInfoRepository.findByPoiId).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should call repository with correct poiId', async () => {
      mockSevenInfoRepository.findByPoiId.mockResolvedValue(null);

      await useCase.handler(456);

      expect(mockSevenInfoRepository.findByPoiId).toHaveBeenCalledTimes(1);
      expect(mockSevenInfoRepository.findByPoiId).toHaveBeenCalledWith(456);
    });
  });
});
