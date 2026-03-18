import { Injectable, Inject } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

export interface deleteImageResult {
  status: 'success' | 'error';
  message?: string;
  error?: any;
}

@Injectable()
export class DeletePoiImagesUsecase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(imageId: number, userId: number): Promise<deleteImageResult> {
    if (!imageId) {
      throw new BadRequestException('imageId is required');
    }

    try {
      const image = await this.poiRepository.findImageById(imageId);

      if (!image) {
        throw new NotFoundException('Image not found');
      }

      await this.poiRepository.deleteImage(imageId, userId);

      return {
        status: 'success',
        message: 'Image deleted successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(error.message);
    }
  }
}
