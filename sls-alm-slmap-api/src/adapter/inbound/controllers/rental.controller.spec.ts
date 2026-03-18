import { Test, TestingModule } from '@nestjs/testing';
import { RentalController } from './rental.controller';
import { GetLocationFromRentalUseCase } from '../../../application/usecases/rental/getLocationFromRental.usecase';
import { GenerateRentalLinkUseCase } from '../../../application/usecases/rental/generateRentalLink.usecase';

describe('RentalController', () => {
  let controller: RentalController;
  let getLocationFromRentalUseCase: jest.Mocked<GetLocationFromRentalUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RentalController],
      providers: [
        {
          provide: GetLocationFromRentalUseCase,
          useValue: {
            handler: jest.fn(),
          },
        },
        {
          provide: GenerateRentalLinkUseCase,
          useValue: {
            handler: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RentalController>(RentalController);
    getLocationFromRentalUseCase = module.get(GetLocationFromRentalUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLocation', () => {
    it('should return whatever the use case returns', async () => {
      const fl = 'FL-001';
      const mockLocation = {
        fl,
        locationName: 'Test Location',
        lat: 13.7563,
        lng: 100.5018,
      };

      getLocationFromRentalUseCase.handler.mockResolvedValue(mockLocation as any);

      const result = await controller.getLocation(fl);

      expect(getLocationFromRentalUseCase.handler).toHaveBeenCalledTimes(1);
      expect(getLocationFromRentalUseCase.handler).toHaveBeenCalledWith(fl);
      expect(result).toEqual(mockLocation);
    });

    it('should propagate errors from the use case', async () => {
      const fl = 'FL-ERR';
      getLocationFromRentalUseCase.handler.mockRejectedValue(
        new Error('Upstream failure'),
      );

      await expect(controller.getLocation(fl)).rejects.toThrow('Upstream failure');
      expect(getLocationFromRentalUseCase.handler).toHaveBeenCalledWith(fl);
    });
  });
});
