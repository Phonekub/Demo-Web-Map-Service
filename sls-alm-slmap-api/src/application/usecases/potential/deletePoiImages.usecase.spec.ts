import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DeletePoiImagesUsecase } from './deletePoiImages.usecase';

describe('DeletePoiImagesUsecase', () => {
  let usecase: DeletePoiImagesUsecase;
  let poiRepository: any;

  beforeEach(async () => {
    const mockPoiRepo = {
      findImageById: jest.fn(),
      deleteImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePoiImagesUsecase,
        { provide: 'PoiRepository', useValue: mockPoiRepo },
      ],
    }).compile();

    usecase = module.get(DeletePoiImagesUsecase);
    poiRepository = module.get('PoiRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deletes image successfully', async () => {
    const imageId = 1;
    const userId = 99;

    poiRepository.findImageById.mockResolvedValue({
      id: imageId,
      name: 'test.jpg',
    });

    poiRepository.deleteImage.mockResolvedValue(undefined);

    const result = await usecase.handler(imageId, userId);

    expect(poiRepository.findImageById).toHaveBeenCalledWith(imageId);

    expect(poiRepository.deleteImage).toHaveBeenCalledWith(imageId, userId);

    expect(result).toEqual({
      status: 'success',
      message: 'Image deleted successfully',
    });
  });

  it('throws BadRequestException when imageId missing', async () => {
    await expect(usecase.handler(0, 1)).rejects.toThrow(BadRequestException);

    expect(poiRepository.findImageById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when image not found', async () => {
    poiRepository.findImageById.mockResolvedValue(null);

    await expect(usecase.handler(1, 1)).rejects.toThrow(NotFoundException);

    expect(poiRepository.deleteImage).not.toHaveBeenCalled();
  });

  it('throws InternalServerErrorException when repository fails', async () => {
    poiRepository.findImageById.mockRejectedValue(new Error('db error'));

    await expect(usecase.handler(1, 1)).rejects.toThrow(InternalServerErrorException);
  });

  it('throws InternalServerErrorException when deleteImage fails', async () => {
    poiRepository.findImageById.mockResolvedValue({
      id: 1,
      name: 'test.jpg',
    });

    poiRepository.deleteImage.mockRejectedValue(new Error('delete fail'));

    await expect(usecase.handler(1, 1)).rejects.toThrow(InternalServerErrorException);
  });
});
