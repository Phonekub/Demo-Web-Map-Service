import { Test, TestingModule } from '@nestjs/testing';
import { PotentialController } from './potential.controller';
import { ApprovePotentialUsecase } from '../../../application/usecases/potential/approvePotential.usecase';
import { GetPotentialDetailUseCase } from '../../../application/usecases/potential/getPotentialDetail.usecase';
import { FindPotentialStatusUsecase } from '../../../application/usecases/potential/findPotentialStatus.usecase';
import { GetPendingApprovalPotentialsUseCase } from '../../../application/usecases/potential/getPendingApprovalPotentials.usecase';
import { CreateRentalFormLocUseCase } from '../../../application/usecases/potential/createRentalFormLoc.usecase';
import { SendApprovePotentialUseCase } from '../../../application/usecases/potential/sendApprovePotential.usecase';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { UploadPoiImagesUsecase } from '../../../application/usecases/potential/uploadPoiImages.usecase';
import { GetPoiImagesUsecase } from '../../../application/usecases/potential/getPoiImages.usecase';
import { DeletePoiImagesUsecase } from '../../../application/usecases/potential/deletePoiImages.usecase';
import { deleteImageResult } from '../../../application/usecases/potential/deletePoiImages.usecase';
import { getImageResult } from '../../../application/usecases/potential/getPoiImages.usecase';
import { uploadImageResult } from '../../../application/usecases/potential/uploadPoiImages.usecase';

describe('PotentialController', () => {
  let controller: PotentialController;

  let approvePotentialUsecase: jest.Mocked<ApprovePotentialUsecase>;
  let getPotentialDetailUseCase: jest.Mocked<GetPotentialDetailUseCase>;
  let findPotentialStatusUsecase: jest.Mocked<FindPotentialStatusUsecase>;
  let getPendingApprovalPotentialsUseCase: jest.Mocked<GetPendingApprovalPotentialsUseCase>;
  let sendApprovePotentialUseCase: jest.Mocked<SendApprovePotentialUseCase>;
  let uploadPoiImagesUsecase: jest.Mocked<UploadPoiImagesUsecase>;
  let getPoiImagesUsecase: jest.Mocked<GetPoiImagesUsecase>;
  let deletePoiImagesUsecase: jest.Mocked<DeletePoiImagesUsecase>;

  const mockReq = (overrides?: Partial<CustomRequest>): CustomRequest =>
    ({
      user: { id: 777 } as any,
      ...overrides,
    }) as CustomRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PotentialController],
      providers: [
        { provide: ApprovePotentialUsecase, useValue: { handler: jest.fn() } },
        { provide: GetPotentialDetailUseCase, useValue: { handler: jest.fn() } },
        { provide: FindPotentialStatusUsecase, useValue: { handler: jest.fn() } },
        {
          provide: GetPendingApprovalPotentialsUseCase,
          useValue: { handler: jest.fn() },
        },
        // Not used by controller methods currently, but required by DI
        { provide: CreateRentalFormLocUseCase, useValue: { handler: jest.fn() } },
        { provide: SendApprovePotentialUseCase, useValue: { handler: jest.fn() } },
        { provide: UploadPoiImagesUsecase, useValue: { handler: jest.fn() } },
        { provide: GetPoiImagesUsecase, useValue: { handler: jest.fn() } },
        { provide: DeletePoiImagesUsecase, useValue: { handler: jest.fn() } },
      ],
    }).compile();

    controller = module.get(PotentialController);

    approvePotentialUsecase = module.get(ApprovePotentialUsecase);
    getPotentialDetailUseCase = module.get(GetPotentialDetailUseCase);
    findPotentialStatusUsecase = module.get(FindPotentialStatusUsecase);
    getPendingApprovalPotentialsUseCase = module.get(GetPendingApprovalPotentialsUseCase);
    uploadPoiImagesUsecase = module.get(UploadPoiImagesUsecase);
    getPoiImagesUsecase = module.get(GetPoiImagesUsecase);
    deletePoiImagesUsecase = module.get(DeletePoiImagesUsecase);
    sendApprovePotentialUseCase = module.get(SendApprovePotentialUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPendingApproval', () => {
    it('should return { data } from use case', async () => {
      const req = mockReq();
      const mockResult = [{ id: 1 }, { id: 2 }];

      getPendingApprovalPotentialsUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.getPendingApproval(req, 10, 999);

      expect(getPendingApprovalPotentialsUseCase.handler).toHaveBeenCalledWith(
        10,
        req.user.id,
        999,
      );
      expect(result).toEqual({ data: mockResult });
    });

    it('should pass undefined wfId/poiId when not provided', async () => {
      const req = mockReq();
      const mockResult: any[] = [];

      getPendingApprovalPotentialsUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.getPendingApproval(req);

      expect(getPendingApprovalPotentialsUseCase.handler).toHaveBeenCalledWith(
        undefined,
        req.user.id,
        undefined,
      );
      expect(result).toEqual({ data: mockResult });
    });
  });

  describe('getDetail', () => {
    it('should return { data } from detail use case', async () => {
      const mockDetail = { id: 123, name: 'Potential A' };
      getPotentialDetailUseCase.handler.mockResolvedValue(mockDetail as any);

      const result = await controller.getDetail(123);

      expect(getPotentialDetailUseCase.handler).toHaveBeenCalledWith(123);
      expect(result).toEqual({ data: mockDetail });
    });
  });

  describe('getPotentialStatus', () => {
    it('should call status use case with id and req.user.id', async () => {
      const req = mockReq();
      const mockStatus = { success: true, status: 'PENDING' };

      findPotentialStatusUsecase.handler.mockResolvedValue(mockStatus as any);

      const result = await controller.getPotentialStatus(req, 555);

      expect(findPotentialStatusUsecase.handler).toHaveBeenCalledWith(555, req.user.id);
      expect(result).toBe(mockStatus);
    });
  });

  describe('sendApprove', () => {
    it('should return result from use case when succeeds', async () => {
      const req = mockReq();
      const body = { poiId: 9 } as any;
      const mockResult = { success: true };

      sendApprovePotentialUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.sendApprove(req, body);

      expect(sendApprovePotentialUseCase.handler).toHaveBeenCalledWith(
        body.poiId,
        req.user.id,
      );
      expect(result).toBe(mockResult);
    });

    it('should return { success:false, message } when use case throws with message', async () => {
      const req = mockReq();
      const body = { poiId: 9 } as any;

      sendApprovePotentialUseCase.handler.mockRejectedValue(new Error('boom'));

      const result = await controller.sendApprove(req, body);

      expect(sendApprovePotentialUseCase.handler).toHaveBeenCalledWith(
        body.poiId,
        req.user.id,
      );
      expect(result).toEqual({ success: false, message: 'boom' });
    });

    it('should return default message when thrown error has no message', async () => {
      const req = mockReq();
      const body = { poiId: 9 } as any;

      sendApprovePotentialUseCase.handler.mockRejectedValue({});

      const result = await controller.sendApprove(req, body);

      expect(sendApprovePotentialUseCase.handler).toHaveBeenCalledWith(
        body.poiId,
        req.user.id,
      );
      expect(result).toEqual({ success: false, message: 'An error occurred' });
    });
  });

  describe('approvePotential', () => {
    it('should call approve use case with mapped payload and return result', async () => {
      const req = mockReq();
      const body = { status: 'APPROVE', remark: 'ok' } as any;
      const mockResult = { success: true, data: { wf: 'done' } };

      approvePotentialUsecase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.approvePotential(req, 321, body);

      expect(approvePotentialUsecase.handler).toHaveBeenCalledWith({
        poiId: 321,
        approvalAction: body.status,
        userId: req.user.id,
        remark: body.remark,
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('getPotentialByPoiId', () => {
    it('should return { data } from detail use case', async () => {
      const mockDetail = { id: 44, poiId: 44 };
      getPotentialDetailUseCase.handler.mockResolvedValue(mockDetail as any);

      const result = await controller.getPotentialByPoiId(44);

      expect(getPotentialDetailUseCase.handler).toHaveBeenCalledWith(44);
      expect(result).toEqual({ data: mockDetail });
    });
  });

  describe('images', () => {
    it('uploadImages should call upload usecase and return result', async () => {
      const files = [
        { originalname: 'a.jpg', buffer: Buffer.from('1') } as Express.Multer.File,
      ];

      const req = mockReq();

      const mockResult: uploadImageResult = {
        status: 'success',
        message: 'Image uploaded successfully',
      };

      uploadPoiImagesUsecase.handler.mockResolvedValue(mockResult);

      const result = await controller.uploadImages(12, files, req);

      expect(uploadPoiImagesUsecase.handler).toHaveBeenCalledWith(12, files, req.user.id);

      expect(result).toEqual(mockResult);
    });

    it('getImages should return { data } from get usecase', async () => {
      const images: getImageResult[] = [
        { id: 1, name: 'img1.jpg', url: 'https://example.com/img1.jpg' },
      ];

      getPoiImagesUsecase.handler.mockResolvedValue(images);

      const result = await controller.getImages(77);

      expect(getPoiImagesUsecase.handler).toHaveBeenCalledWith(77);

      expect(result).toEqual({
        data: images,
      });
    });

    it('deleteImage should call delete usecase and return result', async () => {
      const req = mockReq();

      const mockResult: deleteImageResult = {
        status: 'success',
        message: 'Image deleted successfully',
      };

      deletePoiImagesUsecase.handler.mockResolvedValue(mockResult);

      const result = await controller.deleteImage(99, req);

      expect(deletePoiImagesUsecase.handler).toHaveBeenCalledWith(99, req.user.id);

      expect(result).toEqual(mockResult);
    });
  });
});
