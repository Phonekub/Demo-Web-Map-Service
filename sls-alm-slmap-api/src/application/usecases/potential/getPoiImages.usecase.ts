import { Inject, Injectable } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { BadRequestException } from '@nestjs/common';
import { DataAccessException } from '../../../common/exceptions/quota.exception';
import { S3GatewayPort } from '../../ports/s3.gateway';
import { ConfigService } from '@nestjs/config';

export interface getImageResult {
  id: number;
  name: string;
  url: string;
}

@Injectable()
export class GetPoiImagesUsecase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
    @Inject('S3GatewayPort')
    private readonly s3Gateway: S3GatewayPort,
    private readonly configService: ConfigService,
  ) {}

  async handler(poiId: number): Promise<getImageResult[]> {
    if (!poiId) {
      throw new BadRequestException('poiId is required');
    }

    try {
      const images = await this.poiRepository.findImagesByPoiId(poiId);

      if (!images || images.length === 0) {
        return [];
      }

      const bucketPath = `${this.configService.get('S3_BUCKET')}${this.configService.get('BUCKET_PATH_POI_IMAGE')}`;
      const imagesRes = await Promise.all(
        images.map(async (image) => {
          const destination = `${bucketPath}/${image.name}`;
          const signed = await this.s3Gateway.getSignedDownloadUrl({
            destination,
            durationSeconds: 3600,
          });

          return {
            id: image.id,
            name: image.name,
            url: signed.url,
          };
        }),
      );

      // mock S3 URL ใช้ local file
      // const imagesRes = images.map((image) => ({
      //   id: image.id,
      //   name: image.name,
      //   url: `http://localhost:3000/api/potentials/mock-images/${image.name}`,
      // }));

      return imagesRes;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new DataAccessException(`Failed to get images: ${error.message}`);
    }
  }
}
