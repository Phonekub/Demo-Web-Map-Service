import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { HealthCheckController } from './healthCheck.controller';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;

  const createMockResponse = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
    }).compile();

    controller = module.get<HealthCheckController>(HealthCheckController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return 200 and success message', () => {
      const res = createMockResponse();

      controller.healthCheck(res as any);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith('Health check is ok.');
    });

    it('should call status before send (basic call order)', () => {
      const res = createMockResponse();

      controller.healthCheck(res as any);

      const statusCallOrder = (res.status as jest.Mock).mock.invocationCallOrder[0];
      const sendCallOrder = (res.send as jest.Mock).mock.invocationCallOrder[0];

      expect(statusCallOrder).toBeLessThan(sendCallOrder);
    });
  });
});
