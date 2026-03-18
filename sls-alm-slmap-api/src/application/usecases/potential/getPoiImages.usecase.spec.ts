import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GetPoiImagesUsecase } from './getPoiImages.usecase';
import { DataAccessException } from '../../../common/exceptions/quota.exception';
import { ConfigService } from '@nestjs/config';

describe('GetPoiImagesUsecase', () => {
  let usecase: GetPoiImagesUsecase;
  let poiRepository: any;
  let s3Gateway: any;
  let configService;

  beforeEach(async () => {
    const mockPoiRepo = {
      findImagesByPoiId: jest.fn(),
    };

    const mockS3 = {
      getSignedDownloadUrl: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'S3_BUCKET') return 'sls-alm-slmap-dev';
        if (key === 'BUCKET_PATH_POI_IMAGE') return '/poi/images';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPoiImagesUsecase,
        { provide: 'PoiRepository', useValue: mockPoiRepo },
        { provide: 'S3GatewayPort', useValue: mockS3 },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    usecase = module.get(GetPoiImagesUsecase);
    poiRepository = module.get('PoiRepository');
    s3Gateway = module.get('S3GatewayPort');
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns signed image urls successfully', async () => {
    const poiId = 10;

    const images = [
      { id: 1, name: 'img1.jpg' },
      { id: 2, name: 'img2.png' },
    ];

    poiRepository.findImagesByPoiId.mockResolvedValue(images);

    s3Gateway.getSignedDownloadUrl.mockResolvedValueOnce({
      url: 'https://s3/test-img1',
    });

    s3Gateway.getSignedDownloadUrl.mockResolvedValueOnce({
      url: 'https://s3/test-img2',
    });

    const result = await usecase.handler(poiId);

    expect(poiRepository.findImagesByPoiId).toHaveBeenCalledWith(poiId);

    expect(s3Gateway.getSignedDownloadUrl).toHaveBeenCalledTimes(2);

    expect(s3Gateway.getSignedDownloadUrl).toHaveBeenNthCalledWith(1, {
      destination: 'sls-alm-slmap-dev/poi/images/img1.jpg',
      durationSeconds: 3600,
    });

    expect(s3Gateway.getSignedDownloadUrl).toHaveBeenNthCalledWith(2, {
      destination: 'sls-alm-slmap-dev/poi/images/img2.png',
      durationSeconds: 3600,
    });

    expect(result).toEqual([
      { id: 1, name: 'img1.jpg', url: 'https://s3/test-img1' },
      { id: 2, name: 'img2.png', url: 'https://s3/test-img2' },
    ]);
  });

  it('returns empty array when no images found', async () => {
    poiRepository.findImagesByPoiId.mockResolvedValue([]);

    const result = await usecase.handler(5);

    expect(result).toEqual([]);
    expect(s3Gateway.getSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when poiId is missing', async () => {
    await expect(usecase.handler(0)).rejects.toThrow(BadRequestException);
    await expect(usecase.handler(undefined as any)).rejects.toThrow('poiId is required');
  });

  it('throws DataAccessException when repository fails', async () => {
    poiRepository.findImagesByPoiId.mockRejectedValue(new Error('db error'));

    await expect(usecase.handler(1)).rejects.toThrow(DataAccessException);
    await expect(usecase.handler(1)).rejects.toThrow('Failed to get images: db error');
  });

  it('throws DataAccessException when s3 signed url fails', async () => {
    poiRepository.findImagesByPoiId.mockResolvedValue([{ id: 1, name: 'img1.jpg' }]);

    s3Gateway.getSignedDownloadUrl.mockRejectedValue(new Error('s3 error'));

    await expect(usecase.handler(1)).rejects.toThrow(DataAccessException);
    await expect(usecase.handler(1)).rejects.toThrow('Failed to get images: s3 error');
  });
});
