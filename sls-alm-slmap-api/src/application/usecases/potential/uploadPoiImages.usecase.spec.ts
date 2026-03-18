import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UploadPoiImagesUsecase } from './uploadPoiImages.usecase';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { S3GatewayPort } from '../../ports/s3.gateway';
import { ConfigService } from '@nestjs/config';

describe('UploadPoiImagesUsecase', () => {
  let useCase: UploadPoiImagesUsecase;
  let poiRepository: jest.Mocked<PoiRepositoryPort>;
  let s3Gateway: jest.Mocked<S3GatewayPort>;
  let configService: jest.Mocked<ConfigService>;

  const mockFile: Express.Multer.File = {
    fieldname: 'files',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1234,
    buffer: Buffer.from('mock-image'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    const mockPoiRepository = {
      saveImages: jest.fn(),
    };

    const mockS3Gateway = {
      upload: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'S3_BUCKET') return 'sls-alm-slmap-dev';
        if (key === 'BUCKET_PATH_POI_IMAGE') return '/poi/images';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadPoiImagesUsecase,
        {
          provide: 'PoiRepository',
          useValue: mockPoiRepository,
        },
        {
          provide: 'S3GatewayPort',
          useValue: mockS3Gateway,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    useCase = module.get<UploadPoiImagesUsecase>(UploadPoiImagesUsecase);
    poiRepository = module.get('PoiRepository');
    s3Gateway = module.get('S3GatewayPort');
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should upload images successfully', async () => {
      const poiId = 123;
      const userId = 456;

      s3Gateway.upload.mockResolvedValue(undefined);
      poiRepository.saveImages.mockResolvedValue(undefined);

      const result = await useCase.handler(poiId, [mockFile], userId);

      expect(result).toEqual({
        status: 'success',
        message: 'Image uploaded successfully',
      });

      expect(s3Gateway.upload).toHaveBeenCalledTimes(1);

      expect(poiRepository.saveImages).toHaveBeenCalledWith(
        poiId,
        expect.any(Array),
        userId,
      );
    });

    it('should upload multiple images', async () => {
      const poiId = 123;
      const userId = 456;

      const files = [mockFile, mockFile];

      s3Gateway.upload.mockResolvedValue(undefined);
      poiRepository.saveImages.mockResolvedValue(undefined);

      const result = await useCase.handler(poiId, files, userId);

      expect(result.status).toBe('success');

      expect(s3Gateway.upload).toHaveBeenCalledTimes(2);

      expect(poiRepository.saveImages).toHaveBeenCalledWith(
        poiId,
        expect.any(Array),
        userId,
      );
    });

    it('should throw BadRequestException when no files uploaded', async () => {
      const poiId = 123;
      const userId = 456;

      await expect(useCase.handler(poiId, [], userId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(useCase.handler(poiId, [], userId)).rejects.toThrow(
        'No files uploaded',
      );

      expect(s3Gateway.upload).not.toHaveBeenCalled();
      expect(poiRepository.saveImages).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when files is undefined', async () => {
      const poiId = 123;
      const userId = 456;

      await expect(useCase.handler(poiId, undefined as any, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle S3 upload error', async () => {
      const poiId = 123;
      const userId = 456;

      const errorMessage = 'S3 upload failed';

      s3Gateway.upload.mockRejectedValue(new Error(errorMessage));

      await expect(useCase.handler(poiId, [mockFile], userId)).rejects.toThrow(
        InternalServerErrorException,
      );

      await expect(useCase.handler(poiId, [mockFile], userId)).rejects.toThrow(
        errorMessage,
      );

      expect(poiRepository.saveImages).not.toHaveBeenCalled();
    });

    it('should handle saveImages repository error', async () => {
      const poiId = 123;
      const userId = 456;

      const errorMessage = 'Database error';

      s3Gateway.upload.mockResolvedValue(undefined);
      poiRepository.saveImages.mockRejectedValue(new Error(errorMessage));

      await expect(useCase.handler(poiId, [mockFile], userId)).rejects.toThrow(
        InternalServerErrorException,
      );

      await expect(useCase.handler(poiId, [mockFile], userId)).rejects.toThrow(
        errorMessage,
      );
    });

    it('should pass correct upload parameters to S3', async () => {
      const poiId = 123;
      const userId = 456;

      s3Gateway.upload.mockResolvedValue(undefined);
      poiRepository.saveImages.mockResolvedValue(undefined);

      await useCase.handler(poiId, [mockFile], userId);

      expect(s3Gateway.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: expect.stringContaining('poi/images/'),
          body: mockFile.buffer,
          contentType: mockFile.mimetype,
        }),
      );
    });
  });
});
